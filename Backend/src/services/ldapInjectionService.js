const axios = require('axios');
const { getPayloads, injectPayload } = require('./payloadService');

const LDAP_INDICATOR_PATTERNS = [
  /ldap/i,
  /invalid dn syntax/i,
  /invalid filter/i,
  /directory service/i,
  /protocol error/i,
  /operations error/i,
  /invalidcredentials/i,
  /insufficientaccessrights/i
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

function hasLdapIndicators(responseText, baselineText) {
  return LDAP_INDICATOR_PATTERNS.some(
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

async function testLdapInjection(target) {
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
  const payloads = getPayloads('ldap');

  const baselinePayload = injectPayload(inputs, 'baseline_user');
  const baselineResponse = await sendRequest(url, normalizedMethod, baselinePayload, timeoutMs);
  const baselineText = toText(baselineResponse.data);

  for (let index = 0; index < payloads.length; index += 1) {
    const payload = payloads[index];
    const body = injectPayload(inputs, payload);

    try {
      const response = await sendRequest(url, normalizedMethod, body, timeoutMs);
      const responseText = toText(response.data);

      if (hasLdapIndicators(responseText, baselineText)) {
        return {
          vulnerable: true,
          type: 'LDAP Injection',
          payload,
          payloadIndex: index,
          statusCode: response.status,
          evidence: responseText.slice(0, 400)
        };
      }
    } catch (error) {
      return {
        vulnerable: true,
        type: 'LDAP Injection',
        payload,
        payloadIndex: index,
        evidence: error.message
      };
    }
  }

  return {
    vulnerable: false,
    type: 'LDAP Injection',
    testedPayloadCount: payloads.length
  };
}

module.exports = {
  testLdapInjection
};
