const axios = require('axios');
const { getPayloads } = require('./payloadService');

const XXE_INDICATOR_PATTERNS = [
  /root:x:0:0:/i,
  /daemon:x:\d+:\d+:/i,
  /nobody:x:\d+:\d+:/i,
  /\[extensions\]/i,
  /\[fonts\]/i,
  /for 16-bit app support/i,
  /web-apps\/(?:.|\n){0,80}WEB-INF/i
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

function hasXxeIndicators(responseText, baselineText) {
  return XXE_INDICATOR_PATTERNS.some(
    (pattern) => pattern.test(responseText) && !pattern.test(baselineText)
  );
}

async function sendXmlRequest(url, method, xmlPayload, timeoutMs) {
  return axios({
    url,
    method,
    timeout: timeoutMs,
    headers: {
      'Content-Type': 'application/xml',
      Accept: 'application/json, text/plain, */*'
    },
    data: xmlPayload,
    validateStatus: () => true
  });
}

async function testXxe(target) {
  const {
    url,
    method = 'POST',
    timeoutMs = 10000
  } = target;

  if (!url) {
    throw new Error('Missing target url');
  }

  const normalizedMethod = String(method).toUpperCase();
  const payloads = getPayloads('xxe');

  const baselinePayload = '<?xml version="1.0"?><root><name>baseline</name></root>';
  const baselineResponse = await sendXmlRequest(url, normalizedMethod, baselinePayload, timeoutMs);
  const baselineText = toText(baselineResponse.data);

  for (let index = 0; index < payloads.length; index += 1) {
    const payload = payloads[index];

    try {
      const response = await sendXmlRequest(url, normalizedMethod, payload, timeoutMs);
      const responseText = toText(response.data);

      const reflected = responseText.includes(payload);
      const indicators = hasXxeIndicators(responseText, baselineText);

      if (reflected || indicators) {
        return {
          vulnerable: true,
          type: 'XXE',
          payload,
          payloadIndex: index,
          statusCode: response.status,
          reflected,
          indicators,
          evidence: responseText.slice(0, 400)
        };
      }
    } catch (error) {
      return {
        vulnerable: true,
        type: 'XXE',
        payload,
        payloadIndex: index,
        evidence: error.message
      };
    }
  }

  return {
    vulnerable: false,
    type: 'XXE',
    testedPayloadCount: payloads.length
  };
}

module.exports = {
  testXxe
};
