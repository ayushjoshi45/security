const axios = require('axios');
const cheerio = require('cheerio');

const CSRF_TOKEN_HINTS = ['csrf', '_token', 'authenticity_token', 'xsrf'];
const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function normalizeUrl(baseUrl, href) {
  try {
    return new URL(href || '', baseUrl).toString();
  } catch (error) {
    return href || baseUrl;
  }
}

function hasCsrfTokenField($, formElement) {
  let hasToken = false;

  $(formElement)
    .find('input[type="hidden"], input[name], meta[name]')
    .each((_, field) => {
      const name = ($(field).attr('name') || '').toLowerCase();
      if (CSRF_TOKEN_HINTS.some((hint) => name.includes(hint))) {
        hasToken = true;
      }
    });

  return hasToken;
}

async function testCsrf(url) {
  if (!url) {
    throw new Error('Missing target url');
  }

  const response = await axios.get(url, {
    timeout: 10000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'SECAAS-CSRF-Checker/1.0'
    }
  });

  const $ = cheerio.load(response.data);
  const forms = [];

  $('form').each((_, formElement) => {
    const action = $(formElement).attr('action') || url;
    const method = ($(formElement).attr('method') || 'GET').toUpperCase();
    const hasCsrfToken = hasCsrfTokenField($, formElement);
    const isStateChanging = STATE_CHANGING_METHODS.has(method);

    forms.push({
      action: normalizeUrl(url, action),
      method,
      hasCsrfToken,
      isStateChanging
    });
  });

  const riskyForms = forms.filter((form) => form.isStateChanging && !form.hasCsrfToken);

  return {
    type: 'CSRF',
    url,
    vulnerable: riskyForms.length > 0,
    totalForms: forms.length,
    riskyFormsCount: riskyForms.length,
    riskyForms,
    forms
  };
}

module.exports = {
  testCsrf
};
