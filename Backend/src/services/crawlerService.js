const axios = require('axios');
const cheerio = require('cheerio');

function normalizeUrl(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString();
  } catch (error) {
    return null;
  }
}

async function fetchHtml(url) {
  const response = await axios.get(url, {
    timeout: 10000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'SECAAS-Crawler/1.0'
    }
  });

  return response.data;
}

function getOrigin(url) {
  try {
    return new URL(url).origin;
  } catch (error) {
    return null;
  }
}

function isSameOrigin(url, origin) {
  const urlOrigin = getOrigin(url);
  return Boolean(urlOrigin && origin && urlOrigin === origin);
}

async function extractLinks(url) {
  const html = await fetchHtml(url);
  return extractLinksFromHtml(url, html);
}

function extractLinksFromHtml(url, html) {
  const $ = cheerio.load(html);
  const links = new Set();

  $('a').each((_, element) => {
    const href = $(element).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) {
      return;
    }

    const normalized = normalizeUrl(url, href);
    if (normalized) {
      links.add(normalized);
    }
  });

  return Array.from(links);
}

async function extractForms(url) {
  const html = await fetchHtml(url);
  return extractFormsFromHtml(url, html);
}

function extractFormsFromHtml(url, html) {
  const $ = cheerio.load(html);
  const forms = [];

  $('form').each((_, formElement) => {
    const action = $(formElement).attr('action') || url;
    const method = ($(formElement).attr('method') || 'GET').toUpperCase();
    const inputs = [];

    $(formElement)
      .find('input, textarea, select')
      .each((__, field) => {
        const name = $(field).attr('name');
        const type = $(field).attr('type') || field.tagName;
        if (name) {
          inputs.push({ name, type });
        }
      });

    forms.push({
      action: normalizeUrl(url, action) || action,
      method,
      inputs
    });
  });

  return forms;
}

async function crawlPage(url) {
  const [links, forms] = await Promise.all([extractLinks(url), extractForms(url)]);
  return { url, links, forms };
}

async function crawlWebsite(baseUrl, options = {}) {
  const depthLimit = Number.isInteger(options.depth) ? options.depth : 1;
  const maxPages = Number.isInteger(options.maxPages) ? options.maxPages : 20;
  const includeExternal = Boolean(options.includeExternal);

  const normalizedBaseUrl = normalizeUrl(baseUrl, baseUrl);
  if (!normalizedBaseUrl) {
    throw new Error('Invalid base url');
  }

  const baseOrigin = getOrigin(normalizedBaseUrl);
  const queue = [{ url: normalizedBaseUrl, depth: 0 }];
  const visited = new Set();
  const pages = [];

  while (queue.length > 0 && pages.length < maxPages) {
    const current = queue.shift();
    if (visited.has(current.url)) {
      continue;
    }

    visited.add(current.url);

    try {
      const html = await fetchHtml(current.url);
      const links = extractLinksFromHtml(current.url, html);
      const forms = extractFormsFromHtml(current.url, html);

      pages.push({
        url: current.url,
        depth: current.depth,
        links,
        forms
      });

      if (current.depth < depthLimit) {
        for (const link of links) {
          const canVisit = includeExternal || isSameOrigin(link, baseOrigin);
          if (canVisit && !visited.has(link)) {
            queue.push({ url: link, depth: current.depth + 1 });
          }
        }
      }
    } catch (error) {
      pages.push({
        url: current.url,
        depth: current.depth,
        links: [],
        forms: [],
        error: error.message
      });
    }
  }

  return {
    baseUrl: normalizedBaseUrl,
    totalPagesCrawled: pages.length,
    depthLimit,
    maxPages,
    includeExternal,
    pages
  };
}

module.exports = {
  extractLinks,
  extractForms,
  crawlPage,
  crawlWebsite
};
