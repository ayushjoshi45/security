const {
  getPayloadTypes,
  getPayloads,
  pickPayload,
  injectPayload
} = require('../services/payloadService');

function parseInteger(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function listPayloadTypes(req, res) {
  return res.json({ types: getPayloadTypes() });
}

function listPayloads(req, res) {
  try {
    const type = req.query.type;
    if (!type) {
      return res.json({ payloads: getPayloads() });
    }

    const payloads = getPayloads(type);
    return res.json({ type: String(type).toLowerCase(), count: payloads.length, payloads });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

function buildInjectedPayload(req, res) {
  try {
    const { inputs, payload, type } = req.body || {};
    const payloadIndex = parseInteger(req.body?.payloadIndex, 0);

    const finalPayload = payload || pickPayload(type, payloadIndex);
    const injectedData = injectPayload(inputs, finalPayload);

    return res.json({
      payload: finalPayload,
      injectedData
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = {
  listPayloadTypes,
  listPayloads,
  buildInjectedPayload
};
