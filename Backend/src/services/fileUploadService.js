const axios = require('axios');
const { getPayloads } = require('./payloadService');

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

function likelyAcceptedUpload(responseText, fileName) {
  const acceptanceHints = [
    /upload(?:ed)?\s+(?:success|complete|ok)/i,
    /file\s+saved/i,
    /stored\s+at/i,
    /location/i,
    /path/i
  ];

  const hasFilename = responseText.toLowerCase().includes(fileName.toLowerCase());
  const hasHint = acceptanceHints.some((pattern) => pattern.test(responseText));

  return hasFilename && hasHint;
}

async function uploadOneFile(url, fieldName, filePayload, timeoutMs) {
  const formData = new FormData();
  const content = filePayload.content || '';
  const mimeType = filePayload.mimeType || 'application/octet-stream';
  const blob = new Blob([content], { type: mimeType });

  formData.append(fieldName, blob, filePayload.name);

  const response = await axios.post(url, formData, {
    timeout: timeoutMs,
    validateStatus: () => true
  });

  return response;
}

async function testFileUpload(target) {
  const {
    url,
    fieldName = 'file',
    timeoutMs = 10000
  } = target;

  if (!url) {
    throw new Error('Missing target url');
  }

  const payloads = getPayloads('fileUpload');

  for (let index = 0; index < payloads.length; index += 1) {
    const filePayload = payloads[index];

    try {
      const response = await uploadOneFile(url, fieldName, filePayload, timeoutMs);
      const responseText = toText(response.data);

      if (likelyAcceptedUpload(responseText, filePayload.name)) {
        return {
          vulnerable: true,
          type: 'Insecure File Upload',
          fileName: filePayload.name,
          payloadIndex: index,
          statusCode: response.status,
          evidence: responseText.slice(0, 400)
        };
      }
    } catch (error) {
      return {
        vulnerable: true,
        type: 'Insecure File Upload',
        fileName: filePayload.name,
        payloadIndex: index,
        evidence: error.message
      };
    }
  }

  return {
    vulnerable: false,
    type: 'Insecure File Upload',
    testedPayloadCount: payloads.length
  };
}

module.exports = {
  testFileUpload
};
