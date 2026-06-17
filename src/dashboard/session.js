const crypto = require('crypto');
const cookie = require('cookie');
const config = require('../config');

const COOKIE_NAME = 'baznas_session';
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;
// Render sets NODE_ENV=production; locally this stays false so the cookie
// still works over plain http during dev (browsers drop Secure cookies on http).
const USE_SECURE_COOKIE = process.env.NODE_ENV === 'production';

function sign(value) {
  return crypto.createHmac('sha256', config.dashboard.sessionSecret).update(value).digest('hex');
}

function createSessionCookie() {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `${expires}`;
  const token = `${payload}.${sign(payload)}`;
  return cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: USE_SECURE_COOKIE,
    sameSite: 'lax',
    maxAge: MAX_AGE_SECONDS,
    path: '/',
  });
}

function clearSessionCookie() {
  return cookie.serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: USE_SECURE_COOKIE,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

function isValidSession(req) {
  const cookies = cookie.parse(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  if (!token) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expectedSig = sign(payload);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  const expires = Number(payload);
  return Number.isFinite(expires) && Date.now() < expires;
}

function requireAuthPage(req, res, next) {
  if (isValidSession(req)) return next();
  return res.redirect('/login');
}

function requireAuthApi(req, res, next) {
  if (isValidSession(req)) return next();
  return res.status(401).json({ success: false, message: 'Unauthorized' });
}

module.exports = { createSessionCookie, clearSessionCookie, isValidSession, requireAuthPage, requireAuthApi };
