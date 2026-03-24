const axios = require('axios');

const SENSITIVE_PATTERNS = [
  {
    name: 'API Key',
    pattern: /api[_-]?key["'\s:=]+[A-Za-z0-9_-]{16,}/gi
  },
  {
    name: 'JWT Token',
    pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g
  },
  {
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g
  },
  {
    name: 'Private Key Block',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g
  },
  {
    name: 'Password Assignment',
    pattern: /password["'\s:=]+[^\s"']{6,}/gi
  }
];

function toText(data) {
  if (typeof data === 'string') {
    return data;
  }

  try {
    return JSON.stringify(data);
  } catch (error) {
    return String(data);
  }
}

function collectMatches(text) {
  const matches = [];

  for (const item of SENSITIVE_PATTERNS) {
    const found = text.match(item.pattern) || [];
    for (const match of found.slice(0, 5)) {
      matches.push({
        type: item.name,
        value: match.slice(0, 120)
      });
    }
  }

  return matches;
}

async function testSensitiveDataExposure(target) {
  const {
    url,
    timeoutMs = 10000
  } = target;

  if (!url) {
    throw new Error('Missing target url');
  }

  const response = await axios.get(url, {
    timeout: timeoutMs,
    maxRedirects: 5,
    validateStatus: () => true
  });

  const bodyText = toText(response.data);
  const headerText = toText(response.headers || {});
  const combined = `${bodyText}\n${headerText}`;

  const findings = collectMatches(combined);

  return {
    vulnerable: findings.length > 0,
    type: 'Sensitive Data Exposure',
    url,
    statusCode: response.status,
    findingsCount: findings.length,
    findings
  };
}

module.exports = {
  testSensitiveDataExposure
};
