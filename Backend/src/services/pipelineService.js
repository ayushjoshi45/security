const { crawlWebsite } = require('./crawlerService');
const { testSqlInjection } = require('./sqlInjectionService');
const { testXss } = require('./xssService');
const { testCsrf } = require('./csrfService');
const { testCommandInjection } = require('./commandInjectionService');
const { testXxe } = require('./xxeService');
const { testPathTraversal } = require('./pathTraversalService');
const { testLdapInjection } = require('./ldapInjectionService');
const { testNoSqlInjection } = require('./noSqlInjectionService');
const { testFileUpload } = require('./fileUploadService');
const { testSecurityHeaders } = require('./securityHeadersService');
const { testBrokenAuthentication } = require('./brokenAuthService');
const { testSensitiveDataExposure } = require('./sensitiveDataExposureService');
const { getSeverity } = require('./severityService');

function normalizeInputs(inputs) {
  if (!Array.isArray(inputs)) {
    return [];
  }

  const names = [];
  for (const input of inputs) {
    if (typeof input === 'string' && input.trim()) {
      names.push(input.trim());
      continue;
    }

    if (input && typeof input.name === 'string' && input.name.trim()) {
      names.push(input.name.trim());
    }
  }

  return Array.from(new Set(names));
}

function hasFileInput(inputs) {
  if (!Array.isArray(inputs)) {
    return false;
  }

  return inputs.some((input) => {
    if (!input || typeof input !== 'object') {
      return false;
    }

    return String(input.type || '').toLowerCase() === 'file';
  });
}

function supportsAuthCheck(inputNames) {
  const normalized = inputNames.map((name) => name.toLowerCase());
  const hasUserField = normalized.some((name) =>
    ['username', 'user', 'email', 'login'].some((hint) => name.includes(hint))
  );
  const hasPasswordField = normalized.some((name) =>
    ['password', 'pass', 'pwd'].some((hint) => name.includes(hint))
  );

  return hasUserField && hasPasswordField;
}

async function runCheck(name, fn) {
  try {
    const result = await fn();
    return { name, ...result };
  } catch (error) {
    return {
      name,
      vulnerable: false,
      error: error.message
    };
  }
}

function countVulnerabilitiesFromChecks(checks) {
  return checks.reduce((count, check) => count + (check.vulnerable ? 1 : 0), 0);
}

function classifyChecks(checks) {
  return checks.map((check) => {
    if (!check.vulnerable) {
      return check;
    }

    const vulnerabilityType = check.type || check.name || 'Unknown';
    return {
      ...check,
      severity: getSeverity(vulnerabilityType)
    };
  });
}

function collectVulnerabilities(pages) {
  const vulnerabilities = [];

  for (const page of pages) {
    for (const check of page.pageChecks || []) {
      if (!check.vulnerable) {
        continue;
      }

      vulnerabilities.push({
        pageUrl: page.pageUrl,
        scope: 'page',
        checkName: check.name,
        type: check.type || check.name,
        severity: check.severity || getSeverity(check.type || check.name)
      });
    }

    for (const formReport of page.formReports || []) {
      for (const check of formReport.checks || []) {
        if (!check.vulnerable) {
          continue;
        }

        vulnerabilities.push({
          pageUrl: page.pageUrl,
          scope: 'form',
          formAction: formReport.formAction,
          formMethod: formReport.formMethod,
          checkName: check.name,
          type: check.type || check.name,
          severity: check.severity || getSeverity(check.type || check.name)
        });
      }
    }
  }

  return vulnerabilities;
}

function buildSeverityCounts(vulnerabilities) {
  const counts = {
    High: 0,
    Medium: 0,
    Low: 0
  };

  for (const item of vulnerabilities) {
    const level = item.severity || 'Low';
    if (counts[level] === undefined) {
      counts[level] = 0;
    }
    counts[level] += 1;
  }

  return counts;
}

async function scanWebsitePipeline(baseUrl, options = {}) {
  if (!baseUrl) {
    throw new Error('Missing target baseUrl');
  }

  const method = String(options.method || 'POST').toUpperCase();
  const timeoutMs = Number.isInteger(options.timeoutMs) ? options.timeoutMs : 10000;

  const crawlResult = await crawlWebsite(baseUrl, {
    depth: Number.isInteger(options.depth) ? options.depth : 1,
    maxPages: Number.isInteger(options.maxPages) ? options.maxPages : 20,
    includeExternal: Boolean(options.includeExternal)
  });

  const pageReports = [];
  let totalFormsScanned = 0;
  let totalChecksExecuted = 0;
  let totalVulnerabilities = 0;

  for (const page of crawlResult.pages) {
    const pageChecks = await Promise.all([
      runCheck('csrf', () => testCsrf(page.url)),
      runCheck('securityHeaders', () => testSecurityHeaders({ url: page.url, timeoutMs })),
      runCheck('sensitiveDataExposure', () =>
        testSensitiveDataExposure({ url: page.url, timeoutMs })
      )
    ]);

    const classifiedPageChecks = classifyChecks(pageChecks);

    totalChecksExecuted += classifiedPageChecks.length;
    totalVulnerabilities += countVulnerabilitiesFromChecks(classifiedPageChecks);

    const formReports = [];
    for (const form of page.forms || []) {
      const targetUrl = form.action || page.url;
      const inputNames = normalizeInputs(form.inputs);
      const formChecks = [];

      if (inputNames.length > 0) {
        const formInputTarget = {
          url: targetUrl,
          inputs: inputNames,
          method: form.method || method,
          timeoutMs
        };

        formChecks.push(await runCheck('sqlInjection', () => testSqlInjection(formInputTarget)));
        formChecks.push(await runCheck('xss', () => testXss(formInputTarget)));
        formChecks.push(
          await runCheck('commandInjection', () => testCommandInjection(formInputTarget))
        );
        formChecks.push(await runCheck('ldapInjection', () => testLdapInjection(formInputTarget)));
        formChecks.push(await runCheck('noSqlInjection', () => testNoSqlInjection(formInputTarget)));

        if (supportsAuthCheck(inputNames)) {
          formChecks.push(
            await runCheck('brokenAuthentication', () =>
              testBrokenAuthentication({
                url: targetUrl,
                method: form.method || method,
                timeoutMs
              })
            )
          );
        } else {
          formChecks.push({
            name: 'brokenAuthentication',
            vulnerable: false,
            skipped: true,
            reason: 'No username/password-like fields found'
          });
        }
      }

      formChecks.push(
        await runCheck('xxe', () =>
          testXxe({
            url: targetUrl,
            method: form.method || method,
            timeoutMs
          })
        )
      );

      formChecks.push(
        await runCheck('pathTraversal', () => testPathTraversal({ url: targetUrl, timeoutMs }))
      );

      if (hasFileInput(form.inputs)) {
        formChecks.push(
          await runCheck('fileUpload', () => testFileUpload({ url: targetUrl, timeoutMs }))
        );
      } else {
        formChecks.push({
          name: 'fileUpload',
          vulnerable: false,
          skipped: true,
          reason: 'No file input found in form'
        });
      }

      const classifiedFormChecks = classifyChecks(formChecks);

      totalFormsScanned += 1;
      totalChecksExecuted += classifiedFormChecks.length;
      totalVulnerabilities += countVulnerabilitiesFromChecks(classifiedFormChecks);

      formReports.push({
        formAction: targetUrl,
        formMethod: form.method || method,
        inputCount: inputNames.length,
        checks: classifiedFormChecks
      });
    }

    pageReports.push({
      pageUrl: page.url,
      crawlDepth: page.depth,
      linksDiscovered: (page.links || []).length,
      formsDiscovered: (page.forms || []).length,
      pageChecks: classifiedPageChecks,
      formReports
    });
  }

  const vulnerabilities = collectVulnerabilities(pageReports);
  const severityCounts = buildSeverityCounts(vulnerabilities);

  return {
    type: 'Full Scan Pipeline',
    baseUrl: crawlResult.baseUrl,
    scanStartedAt: new Date().toISOString(),
    options: {
      depth: crawlResult.depthLimit,
      maxPages: crawlResult.maxPages,
      includeExternal: crawlResult.includeExternal,
      method,
      timeoutMs
    },
    totalPagesScanned: crawlResult.totalPagesCrawled,
    totalFormsScanned,
    totalChecksExecuted,
    totalVulnerabilities,
    severityCounts,
    vulnerabilities,
    pages: pageReports
  };
}

module.exports = {
  scanWebsitePipeline
};
