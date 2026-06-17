const express = require('express');
const multer = require('multer');
const { verifyInitData } = require('./verifyInitData');
const { sendMessage } = require('./client');
const { validateKiprahData } = require('../flow/validateKiprah');
const { appendAlumniRow, uploadPhotoForRow } = require('../google/appsScript');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

router.post('/telegram/submit', upload.array('foto_terbaik', 5), async (req, res) => {
  const { valid, user } = verifyInitData(req.body.initData);
  if (!valid) {
    return res.status(401).json({
      success: false,
      message: 'Sesi tidak valid atau kedaluwarsa. Silakan buka ulang formulir dari bot.',
    });
  }

  const data = { ...req.body, foto_terbaik: req.files };
  const validation = validateKiprahData(data);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  try {
    const rowIndex = await appendAlumniRow({
      timestamp: new Date().toISOString(),
      channel: 'Telegram',
      telegram_username: user.username || String(user.id),
      nama_lengkap: data.nama_lengkap,
      program_beasiswa: data.program_beasiswa,
      asal_kampus: data.asal_kampus,
      tahun_masuk: data.tahun_masuk,
      jurusan: data.jurusan,
      jenis_kelamin: data.jenis_kelamin,
      nomor_hp: validation.normalizedPhone,
      domisili: data.domisili,
      provinsi: data.provinsi,
      instagram_facebook: data.instagram_facebook,
      tanggal_lulus: data.tanggal_lulus,
      ipk: data.ipk,
      lama_kuliah_bulan: data.lama_kuliah_bulan,
      masa_tunggu_bulan: data.masa_tunggu_bulan,
      sektor_pekerjaan: data.sektor_pekerjaan,
      kategori_sektor: data.kategori_sektor,
      tempat_bekerja: data.tempat_bekerja,
      posisi_jabatan: data.posisi_jabatan,
      pendapatan: data.pendapatan,
      jobdesk_singkat: data.jobdesk_singkat,
      kata_motivasi: data.kata_motivasi,
    });

    for (const [index, file] of req.files.entries()) {
      await uploadPhotoForRow(
        rowIndex,
        file.buffer,
        file.originalname || `telegram-${user.id}-foto-${index + 1}.jpg`,
        file.mimetype || 'image/jpeg'
      );
    }

    sendMessage(user.id, 'Terima kasih! Data Tracer Alumni Anda telah berhasil disimpan.').catch(
      (err) => console.error('Failed to send Telegram confirmation:', err.response?.data || err.message)
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Error saving Telegram submission:', err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
    });
  }
});

module.exports = router;
