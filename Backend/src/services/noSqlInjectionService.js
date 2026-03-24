const axios = require('axios');
const { getPayloads } = require('./payloadService');

const NOSQL_INDICATOR_PATTERNS = [
  /mongo/i,
  /mongodb/i,
  /bson/i,
  /cast to objectid failed/i,
  /cannot use \$\w+ with/i,
  /operator not allowed/i,
  /query failed/i,
  /badvalue/i,
  /unknown operator/i,
  /failed to parse/i
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

function tryParseJson(value) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
}

function hasNoSqlIndicators(responseText, baselineText) {
  return NOSQL_INDICATOR_PATTERNS.some(
    (pattern) => pattern.test(responseText) && !pattern.test(baselineText)
  );
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

function buildBody(inputs, payloadValue) {
  const body = {};
  for (const input of inputs) {
    if (typeof input === 'string' && input.trim()) {
      body[input] = payloadValue;
      continue;
    }

    if (input && typeof input.name === 'string' && input.name.trim()) {
      body[input.name] = payloadValue;
    }
  }

  if (Object.keys(body).length === 0) {
    throw new Error('No valid input names found for NoSQL payload injection');
  }

  return body;
}

async function testNoSqlInjection(target) {
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
  const payloads = getPayloads('nosql');

  const baselineBody = buildBody(inputs, 'baseline_user');
  const baselineResponse = await sendRequest(url, normalizedMethod, baselineBody, timeoutMs);
  const baselineText = toText(baselineResponse.data);

  for (let index = 0; index < payloads.length; index += 1) {
    const rawPayload = payloads[index];
    const parsedPayload = tryParseJson(rawPayload);
    const body = buildBody(inputs, parsedPayload);

    try {
      const response = await sendRequest(url, normalizedMethod, body, timeoutMs);
      const responseText = toText(response.data);

      if (hasNoSqlIndicators(responseText, baselineText)) {
        return {
          vulnerable: true,
          type: 'NoSQL Injection',
          payload: rawPayload,
          payloadIndex: index,
          statusCode: response.status,
          evidence: responseText.slice(0, 400)
        };
      }
    } catch (error) {
      return {
        vulnerable: true,
        type: 'NoSQL Injection',
        payload: rawPayload,
        payloadIndex: index,
        evidence: error.message
      };
    }
  }

  return {
    vulnerable: false,
    type: 'NoSQL Injection',
    testedPayloadCount: payloads.length
  };
}

module.exports = {
  testNoSqlInjection
};
