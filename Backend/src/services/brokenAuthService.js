const axios = require('axios');
const { getPayloads } = require('./payloadService');

const LOGIN_SUCCESS_PATTERNS = [
  /welcome/i,
  /dashboard/i,
  /logged in/i,
  /token/i,
  /session/i,
  /auth/i
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

function looksLikeSuccessfulLogin(statusCode, responseText) {
  if (statusCode >= 200 && statusCode < 300) {
    return LOGIN_SUCCESS_PATTERNS.some((pattern) => pattern.test(responseText));
  }

  return false;
}

function buildLoginBody(templateBody, credentialPair, usernameField, passwordField) {
  const body = { ...(templateBody || {}) };
  body[usernameField] = credentialPair.username;
  body[passwordField] = credentialPair.password;
  return body;
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

async function testBrokenAuthentication(target) {
  const {
    url,
    method = 'POST',
    timeoutMs = 10000,
    usernameField = 'username',
    passwordField = 'password',
    body = {}
  } = target;

  if (!url) {
    throw new Error('Missing target url');
  }

  const normalizedMethod = String(method).toUpperCase();
  const credentials = getPayloads('auth');

  for (let index = 0; index < credentials.length; index += 1) {
    const pair = credentials[index];
    const requestBody = buildLoginBody(body, pair, usernameField, passwordField);

    try {
      const response = await sendRequest(url, normalizedMethod, requestBody, timeoutMs);
      const responseText = toText(response.data);

      if (looksLikeSuccessfulLogin(response.status, responseText)) {
        return {
          vulnerable: true,
          type: 'Broken Authentication',
          credential: pair,
          payloadIndex: index,
          statusCode: response.status,
          evidence: responseText.slice(0, 400)
        };
      }
    } catch (error) {
      continue;
    }
  }

  return {
    vulnerable: false,
    type: 'Broken Authentication',
    testedCredentialCount: credentials.length
  };
}

module.exports = {
  testBrokenAuthentication
};
