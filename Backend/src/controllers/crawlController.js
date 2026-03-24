const {
  extractLinks,
  extractForms,
  crawlPage,
  crawlWebsite
} = require('../services/crawlerService');

function resolveUrl(req) {
  return req.query.url || req.body?.url;
}

function parseNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return String(value).toLowerCase() === 'true';
}

async function getLinks(req, res) {
  try {
    const url = resolveUrl(req);
    if (!url) {
      return res.status(400).json({ error: 'Missing url query parameter' });
    }

    const links = await extractLinks(url);
    return res.json({ url, count: links.length, links });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to extract links', detail: error.message });
  }
}

async function getForms(req, res) {
  try {
    const url = resolveUrl(req);
    if (!url) {
      return res.status(400).json({ error: 'Missing url query parameter' });
    }

    const forms = await extractForms(url);
    return res.json({ url, count: forms.length, forms });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to extract forms', detail: error.message });
  }
}

async function crawlSinglePage(req, res) {
  try {
    const url = resolveUrl(req);
    if (!url) {
      return res.status(400).json({ error: 'Missing url in request' });
    }

    const result = await crawlPage(url);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Single page crawl failed', detail: error.message });
  }
}

async function crawlSite(req, res) {
  try {
    const url = resolveUrl(req);
    if (!url) {
      return res.status(400).json({ error: 'Missing url in request' });
    }

    const options = {
      depth: parseNumber(req.query.depth ?? req.body?.depth, 1),
      maxPages: parseNumber(req.query.maxPages ?? req.body?.maxPages, 20),
      includeExternal: parseBoolean(req.query.includeExternal ?? req.body?.includeExternal, false)
    };

    const result = await crawlWebsite(url, options);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: 'Site crawl failed', detail: error.message });
  }
}

module.exports = {
  getLinks,
  getForms,
  crawlSinglePage,
  crawlSite
};
