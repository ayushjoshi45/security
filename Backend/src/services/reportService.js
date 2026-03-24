const RECOMMENDATIONS = {
  'SQL Injection': 'Use parameterized queries and strict server-side input validation.',
  XSS: 'Sanitize user input and enforce output encoding and a strict CSP.',
  CSRF: 'Add anti-CSRF tokens and validate Origin/Referer for state-changing actions.',
  'Command Injection': 'Avoid shell execution with user input and use strict allowlists.',
  XXE: 'Disable external entity resolution in XML parsers and validate XML input.',
  'Path Traversal': 'Normalize and validate paths against allowlisted directories.',
  'LDAP Injection': 'Use parameterized LDAP queries and sanitize special LDAP characters.',
  'NoSQL Injection': 'Validate JSON schema and block operators such as $where/$ne from user input.',
  'Insecure File Upload': 'Restrict file types, inspect content, and store files outside webroot.',
  'Missing Security Headers': 'Add baseline headers: CSP, HSTS, X-Frame-Options, and X-Content-Type-Options.',
  'Broken Authentication': 'Enforce strong credentials, lockout policy, and MFA where possible.',
  'Sensitive Data Exposure': 'Remove secrets from responses and rotate exposed credentials immediately.'
};

const SEVERITY_WEIGHT = {
  High: 3,
  Medium: 2,
  Low: 1
};

function groupByPage(vulnerabilities) {
  const grouped = {};

  for (const item of vulnerabilities) {
    const pageUrl = item.pageUrl || 'unknown';
    if (!grouped[pageUrl]) {
      grouped[pageUrl] = [];
    }

    grouped[pageUrl].push({
      type: item.type,
      severity: item.severity,
      scope: item.scope,
      formAction: item.formAction || null,
      formMethod: item.formMethod || null,
      recommendation: RECOMMENDATIONS[item.type] || 'Review and remediate based on secure coding best practices.'
    });
  }

  return Object.entries(grouped).map(([pageUrl, findings]) => ({
    pageUrl,
    findingsCount: findings.length,
    findings
  }));
}

function calculateRiskScore(vulnerabilities) {
  return vulnerabilities.reduce((score, item) => {
    const weight = SEVERITY_WEIGHT[item.severity] || 1;
    return score + weight;
  }, 0);
}

function determineRiskLevel(score) {
  if (score >= 20) {
    return 'Critical';
  }

  if (score >= 10) {
    return 'High';
  }

  if (score >= 5) {
    return 'Medium';
  }

  return 'Low';
}

function buildTopFindings(vulnerabilities, limit = 10) {
  const sorted = [...vulnerabilities].sort((a, b) => {
    const left = SEVERITY_WEIGHT[b.severity] || 1;
    const right = SEVERITY_WEIGHT[a.severity] || 1;
    if (left !== right) {
      return left - right;
    }

    return String(a.type).localeCompare(String(b.type));
  });

  return sorted.slice(0, limit).map((item) => ({
    pageUrl: item.pageUrl,
    type: item.type,
    severity: item.severity,
    scope: item.scope,
    recommendation: RECOMMENDATIONS[item.type] || 'Review and remediate based on secure coding best practices.'
  }));
}

function generateReport(scanResult) {
  const vulnerabilities = Array.isArray(scanResult?.vulnerabilities)
    ? scanResult.vulnerabilities
    : [];

  const severityCounts = scanResult?.severityCounts || {
    High: 0,
    Medium: 0,
    Low: 0
  };

  const riskScore = calculateRiskScore(vulnerabilities);

  return {
    type: 'Scan Report',
    generatedAt: new Date().toISOString(),
    baseUrl: scanResult?.baseUrl || null,
    scanDate: scanResult?.scanStartedAt || null,
    totalPagesScanned: scanResult?.totalPagesScanned || 0,
    totalFormsScanned: scanResult?.totalFormsScanned || 0,
    totalVulnerabilities: vulnerabilities.length,
    severityCounts,
    riskScore,
    riskLevel: determineRiskLevel(riskScore),
    topFindings: buildTopFindings(vulnerabilities, 10),
    findingsByPage: groupByPage(vulnerabilities)
  };
}

module.exports = {
  generateReport
};
