const express = require('express');
const axios = require('axios');
const config = require('../config');
const { requireAuthApi } = require('./session');
const { getRows } = require('./dataCache');
const { summarize } = require('./summarize');
const { rowsToCsv } = require('./rowsToCsv');

const router = express.Router();
const MAX_ROWS_IN_CONTEXT = 500;

function buildSystemPrompt(summary, csvInfo) {
  let prompt =
    'Anda adalah asisten data dan analis strategi untuk Dashboard Tracer Alumni BAZNAS. ' +
    'Anda memiliki dua peran:\n' +
    '1. Menjawab pertanyaan faktual tentang data alumni (jumlah, rata-rata, mencari alumni tertentu, dll).\n' +
    '2. Memberikan ANALISIS STRATEGIS dan REKOMENDASI KEBIJAKAN untuk BAZNAS berdasarkan data ini - misalnya: ' +
    'program beasiswa mana yang paling efektif (dilihat dari tingkat keterserapan kerja, pendapatan, IPK, dan masa tunggu kerja), ' +
    'apakah alokasi dana sebaiknya lebih difokuskan ke program luar negeri atau dalam negeri, program/provinsi mana yang ' +
    'berkembang vs kurang diminati, atau rekomendasi lain tentang ke mana sebaiknya distribusi beasiswa BAZNAS diarahkan ke depan. ' +
    'Untuk analisis strategis, gunakan terutama field "outcome_per_program_beasiswa" dan ' +
    '"perbandingan_program_luar_negeri_vs_lainnya" di ringkasan statistik, dan SELALU dukung rekomendasi Anda dengan angka ' +
    'konkret dari data tersebut serta jelaskan alasannya - jangan memberi opini tanpa dasar data.\n\n' +
    'Jawab dalam Bahasa Indonesia, gunakan format markdown (tabel/list/bold) bila membantu kejelasan, JANGAN gunakan emoji ' +
    'atau simbol bernomor seperti 1⃣ 2⃣ (gunakan list/tabel markdown biasa untuk penomoran), dan jangan mengarang ' +
    'informasi yang tidak ada di data berikut.\n\n' +
    'RINGKASAN STATISTIK (gunakan untuk pertanyaan agregat/total dan analisis strategis):\n' +
    JSON.stringify(summary) +
    '\n\nDATA MENTAH per alumni dalam format CSV (gunakan untuk pertanyaan spesifik/detail, ' +
    'misalnya mencari alumni tertentu atau membandingkan beberapa data). ' +
    'Kolom kontak pribadi (nomor HP, username Telegram, Instagram/Facebook) sengaja tidak disertakan untuk menjaga privasi:\n' +
    csvInfo.csv;

  if (csvInfo.includedCount < csvInfo.totalCount) {
    prompt +=
      `\n\n(Catatan: data mentah di atas hanya menampilkan ${csvInfo.includedCount} dari total ${csvInfo.totalCount} alumni ` +
      'karena keterbatasan ukuran - gunakan ringkasan statistik di atas untuk angka total keseluruhan.)';
  }
  return prompt;
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
    const csvInfo = rowsToCsv(rows, { maxRows: MAX_ROWS_IN_CONTEXT });

    const messages = [
      { role: 'system', content: buildSystemPrompt(summary, csvInfo) },
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
        timeout: 60000,
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
