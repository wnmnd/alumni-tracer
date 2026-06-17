const crypto = require('crypto');
const config = require('../config');

function isValidSignature(rawBody, signatureHeader) {
  if (!config.whatsapp.appSecret) return true; // signature check disabled
  if (!signatureHeader) return false;

  const expected =
    'sha256=' +
    crypto.createHmac('sha256', config.whatsapp.appSecret).update(rawBody).digest('hex');

  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

module.exports = { isValidSignature };
