const crypto = require('crypto');
const config = require('../config');

const MAX_AGE_SECONDS = 24 * 60 * 60;

// Implements Telegram's documented Mini App initData validation:
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
function verifyInitData(initData) {
  if (!initData) return { valid: false, reason: 'missing initData' };

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { valid: false, reason: 'missing hash' };
  params.delete('hash');

  const dataCheckString = Array.from(params.keys())
    .sort()
    .map((key) => `${key}=${params.get(key)}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(config.telegram.botToken).digest();
  const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  const computedBuf = Buffer.from(computedHash, 'hex');
  const hashBuf = Buffer.from(hash, 'hex');
  if (computedBuf.length !== hashBuf.length || !crypto.timingSafeEqual(computedBuf, hashBuf)) {
    return { valid: false, reason: 'hash mismatch' };
  }

  const authDate = Number(params.get('auth_date'));
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) {
    return { valid: false, reason: 'expired' };
  }

  let user = {};
  try {
    user = JSON.parse(params.get('user') || '{}');
  } catch {
    return { valid: false, reason: 'invalid user payload' };
  }

  return { valid: true, user };
}

module.exports = { verifyInitData };
