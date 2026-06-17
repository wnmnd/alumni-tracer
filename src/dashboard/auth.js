const crypto = require('crypto');
const express = require('express');
const config = require('../config');
const { createSessionCookie, clearSessionCookie } = require('./session');

const router = express.Router();

function safeEqual(a, b) {
  const aBuf = Buffer.from(String(a || ''));
  const bBuf = Buffer.from(String(b || ''));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

router.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  const validUsername = safeEqual(username, config.dashboard.adminUsername);
  const validPassword = safeEqual(password, config.dashboard.adminPassword);

  if (!validUsername || !validPassword) {
    return res.status(401).json({ success: false, message: 'Username atau password salah.' });
  }

  res.setHeader('Set-Cookie', createSessionCookie());
  return res.json({ success: true });
});

router.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', clearSessionCookie());
  return res.json({ success: true });
});

module.exports = router;
