const axios = require('axios');
const { getPayloads, injectPayload } = require('./payloadService');

const XSS_INDICATOR_PATTERNS = [
  /<script[^>]*>.*<\/script>/i,
  /onerror\s*=/i,
  /onload\s*=/i,
  /javascript:/i,
  /svg\s*\/?>/i
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

function isPayloadReflected(responseText, payload) {
  return responseText.includes(payload);
}

function hasXssIndicators(responseText) {
  return XSS_INDICATOR_PATTERNS.some((pattern) => pattern.test(responseText));
}

async function sendRequest(url, method, body, timeoutMs) {
  return axios({
    url,
    method,
    timeout: timeoutMs,
    headers: {
      'Content-Type': 'application/json'
    },
    data: body,
    validateStatus: () => true
  });
}

async function testXss(target) {
  const {
    url,
    inputs,
    method = 'POST',
    timeoutMs = 10000
  } = target;

  if (!url) {
    throw new Error('Missing target url');
  }

  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw new Error('inputs must be a non-empty array');
  }

  const normalizedMethod = String(method).toUpperCase();
  const payloads = getPayloads('xss');

  for (let index = 0; index < payloads.length; index += 1) {
    const payload = payloads[index];
    const body = injectPayload(inputs, payload);

    try {
      const response = await sendRequest(url, normalizedMethod, body, timeoutMs);
      const responseText = toText(response.data);

      const reflected = isPayloadReflected(responseText, payload);
      const indicators = hasXssIndicators(responseText);

      if (reflected || indicators) {
        return {
          vulnerable: true,
          type: 'XSS',
          payload,
          payloadIndex: index,
          statusCode: response.status,
          evidence: responseText.slice(0, 400),
          reflected,
          indicators
        };
      }
    } catch (error) {
      return {
        vulnerable: true,
        type: 'XSS',
        payload,
        payloadIndex: index,
        evidence: error.message
      };
    }
  }

  return {
    vulnerable: false,
    type: 'XSS',
    testedPayloadCount: payloads.length
  };
}

module.exports = {
  testXss
};
