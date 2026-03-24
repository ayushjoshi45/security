const axios = require('axios');
const { getPayloads, injectPayload } = require('./payloadService');

const SQL_ERROR_PATTERNS = [
  /sql syntax/i,
  /mysql/i,
  /syntax error/i,
  /unclosed quotation mark/i,
  /sqlstate/i,
  /odbc/i,
  /postgresql/i,
  /sqlite/i,
  /ora-\d+/i
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

function hasSqlIndicators(responseText, baselineText) {
  if (SQL_ERROR_PATTERNS.some((pattern) => pattern.test(responseText))) {
    return true;
  }

  const baselineLength = baselineText.length;
  const responseLength = responseText.length;

  if (baselineLength === 0) {
    return false;
  }

  const growthRatio = responseLength / baselineLength;
  return growthRatio >= 2;
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

async function testSqlInjection(target) {
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
  const payloads = getPayloads('sql');

  const baselinePayload = injectPayload(inputs, 'baseline_probe');
  const baselineResponse = await sendRequest(url, normalizedMethod, baselinePayload, timeoutMs);
  const baselineText = toText(baselineResponse.data);

  for (let index = 0; index < payloads.length; index += 1) {
    const payload = payloads[index];
    const body = injectPayload(inputs, payload);

    try {
      const response = await sendRequest(url, normalizedMethod, body, timeoutMs);
      const responseText = toText(response.data);

      if (hasSqlIndicators(responseText, baselineText)) {
        return {
          vulnerable: true,
          type: 'SQL Injection',
          payload,
          payloadIndex: index,
          statusCode: response.status,
          evidence: responseText.slice(0, 400)
        };
      }
    } catch (error) {
      return {
        vulnerable: true,
        type: 'SQL Injection',
        payload,
        payloadIndex: index,
        evidence: error.message
      };
    }
  }

  return {
    vulnerable: false,
    type: 'SQL Injection',
    testedPayloadCount: payloads.length
  };
}

module.exports = {
  testSqlInjection
};
