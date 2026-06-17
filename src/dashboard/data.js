const express = require('express');
const { requireAuthApi } = require('./session');
const { getRows } = require('./dataCache');

const router = express.Router();

router.get('/api/dashboard-data', requireAuthApi, async (req, res) => {
  try {
    const rows = await getRows({ force: req.query.refresh === '1' });
    return res.json({ success: true, rows });
  } catch (err) {
    console.error('Failed to fetch dashboard data:', err.message);
    return res.status(502).json({ success: false, message: 'Gagal mengambil data dari Google Sheet.' });
  }
});

module.exports = router;
