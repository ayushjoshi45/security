const axios = require('axios');
const { getPayloads } = require('./payloadService');

const TRAVERSAL_INDICATOR_PATTERNS = [
  /root:x:0:0:/i,
  /daemon:x:\d+:\d+:/i,
  /\[fonts\]/i,
  /\[extensions\]/i,
  /localhost\s*\n/i,
  /127\.0\.0\.1/i
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

function hasTraversalIndicators(responseText, baselineText) {
  return TRAVERSAL_INDICATOR_PATTERNS.some(
    (pattern) => pattern.test(responseText) && !pattern.test(baselineText)
  );
}

async function sendGetRequest(url, paramName, paramValue, timeoutMs) {
  return axios.get(url, {
    timeout: timeoutMs,
    params: {
      [paramName]: paramValue
    },
    validateStatus: () => true
  });
}

async function testPathTraversal(target) {
  const {
    url,
    timeoutMs = 10000,
    paramNames = ['file', 'path', 'filename', 'document']
  } = target;

  if (!url) {
    throw new Error('Missing target url');
  }

  if (!Array.isArray(paramNames) || paramNames.length === 0) {
    throw new Error('paramNames must be a non-empty array');
  }

  const payloads = getPayloads('pathTraversal');

  for (const paramName of paramNames) {
    const baselineResponse = await sendGetRequest(url, paramName, 'baseline_file.txt', timeoutMs);
    const baselineText = toText(baselineResponse.data);

    for (let index = 0; index < payloads.length; index += 1) {
      const payload = payloads[index];

      try {
        const response = await sendGetRequest(url, paramName, payload, timeoutMs);
        const responseText = toText(response.data);

        if (hasTraversalIndicators(responseText, baselineText)) {
          return {
            vulnerable: true,
            type: 'Path Traversal',
            payload,
            payloadIndex: index,
            parameter: paramName,
            statusCode: response.status,
            evidence: responseText.slice(0, 400)
          };
        }
      } catch (error) {
        return {
          vulnerable: true,
          type: 'Path Traversal',
          payload,
          payloadIndex: index,
          parameter: paramName,
          evidence: error.message
        };
      }
    }
  }

  return {
    vulnerable: false,
    type: 'Path Traversal',
    testedPayloadCount: payloads.length,
    testedParameters: paramNames.length
  };
}

module.exports = {
  testPathTraversal
};
