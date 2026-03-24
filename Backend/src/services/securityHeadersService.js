const axios = require('axios');

const REQUIRED_HEADERS = {
  'x-frame-options': 'Use DENY or SAMEORIGIN to block clickjacking',
  'x-content-type-options': 'Set to nosniff to prevent MIME sniffing',
  'content-security-policy': 'Define a CSP to reduce XSS impact',
  'strict-transport-security': 'Enable HSTS for HTTPS-only access'
};

function normalizeHeaderValue(value) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return value ?? null;
}

async function testSecurityHeaders(target) {
  const { url, timeoutMs = 10000 } = target;

  if (!url) {
    throw new Error('Missing target url');
  }

  const response = await axios.get(url, {
    timeout: timeoutMs,
    maxRedirects: 5,
    validateStatus: () => true
  });

  const foundHeaders = {};
  const missingHeaders = [];

  for (const [headerName, recommendation] of Object.entries(REQUIRED_HEADERS)) {
    const value = normalizeHeaderValue(response.headers?.[headerName]);

    if (value) {
      foundHeaders[headerName] = value;
    } else {
      missingHeaders.push({
        header: headerName,
        recommendation
      });
    }
  }

  return {
    type: 'Missing Security Headers',
    url,
    vulnerable: missingHeaders.length > 0,
    statusCode: response.status,
    totalRequiredHeaders: Object.keys(REQUIRED_HEADERS).length,
    foundHeaderCount: Object.keys(foundHeaders).length,
    foundHeaders,
    missingHeaders
  };
}

module.exports = {
  testSecurityHeaders
};
