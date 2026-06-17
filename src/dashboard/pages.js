const path = require('path');
const express = require('express');
const { requireAuthPage, isValidSession } = require('./session');

const router = express.Router();
const publicDir = path.join(__dirname, '..', '..', 'public', 'dashboard');

router.get('/login', (req, res) => {
  if (isValidSession(req)) return res.redirect('/dashboard');
  return res.sendFile(path.join(publicDir, 'login.html'));
});

router.get('/dashboard', requireAuthPage, (req, res) => {
  return res.sendFile(path.join(publicDir, 'index.html'));
});

router.get('/dashboard/table', requireAuthPage, (req, res) => {
  return res.sendFile(path.join(publicDir, 'table.html'));
});

module.exports = router;
