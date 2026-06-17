const express = require('express');
const axios = require('axios');
const config = require('../config');
const { requireAuthApi } = require('./session');
const { getRows } = require('./dataCache');
const { summarize } = require('./summarize');

const router = express.Router();

function buildSystemPrompt(summary) {
  return (
    'Anda adalah asisten data untuk Dashboard Tracer Alumni BAZNAS. ' +
    'Jawab pertanyaan pengguna tentang data alumni penerima beasiswa BAZNAS secara singkat, jelas, dan dalam Bahasa Indonesia. ' +
    'Gunakan ringkasan statistik berikut sebagai dasar jawaban (jangan mengarang angka di luar ini): ' +
    JSON.stringify(summary)
  );
}

router.post('/api/chat', requireAuthApi, async (req, res) => {
  const { message, history } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong.' });
  }

  if (!config.openRouter.apiKey) {
    return res.status(503).json({
      success: false,
      message: 'Chatbot belum dikonfigurasi. Tambahkan OPENROUTER_API_KEY terlebih dahulu.',
    });
  }

  try {
    const rows = await getRows();
    const summary = summarize(rows);

    const messages = [
      { role: 'system', content: buildSystemPrompt(summary) },
      ...(Array.isArray(history) ? history.slice(-10) : []),
      { role: 'user', content: message },
    ];

    const { data } = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      { model: config.openRouter.model, messages },
      {
        headers: {
          Authorization: `Bearer ${config.openRouter.apiKey}`,
          'HTTP-Referer': config.telegram.publicBaseUrl || 'https://baznas-alumni-tracer.onrender.com',
          'X-Title': 'BAZNAS Alumni Tracer Dashboard',
        },
        timeout: 30000,
      }
    );

    const reply = data.choices?.[0]?.message?.content;
    if (!reply) throw new Error('Empty response from model');

    return res.json({ success: true, reply });
  } catch (err) {
    console.error('Chat error:', err.response?.data || err.message);
    return res.status(502).json({
      success: false,
      message: 'Maaf, terjadi kesalahan saat menghubungi chatbot. Silakan coba lagi.',
    });
  }
});

module.exports = router;
