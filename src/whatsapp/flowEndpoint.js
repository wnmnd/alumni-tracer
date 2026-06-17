const express = require('express');
const config = require('../config');
const { decryptRequest, encryptResponse } = require('./encryption');
const { downloadAndDecryptFlowMedia } = require('./mediaDownload');
const { validateKiprahData } = require('../flow/validateKiprah');
const { appendAlumniRow } = require('../google/sheets');
const { uploadPhoto } = require('../google/drive');

const router = express.Router();

router.post('/flow-data-exchange', async (req, res) => {
  let decrypted;
  try {
    decrypted = decryptRequest(req.body, config.flow.privateKey, config.flow.privateKeyPassphrase);
  } catch (err) {
    console.error('Failed to decrypt Flow request', err);
    return res.sendStatus(421);
  }

  const { aesKey, iv } = decrypted;
  const { action, screen, data, flow_token } = decrypted.decryptedBody;

  try {
    const responsePayload = await handleAction({ action, screen, data, flow_token });
    return res.send(encryptResponse(responsePayload, aesKey, iv));
  } catch (err) {
    console.error('Error handling Flow data exchange', err);
    return res.send(
      encryptResponse(
        {
          version: '3.0',
          screen: screen || 'KIPRAH_ALUMNI',
          data: {
            has_error: true,
            validation_error: 'Terjadi kesalahan pada server. Silakan coba lagi.',
            ...data,
          },
        },
        aesKey,
        iv
      )
    );
  }
});

async function handleAction({ action, screen, data, flow_token }) {
  if (action === 'ping') {
    return { version: '3.0', data: { status: 'active' } };
  }

  if (action === 'INIT') {
    return { version: '3.0', screen: 'DATA_DIRI', data: {} };
  }

  if (action === 'data_exchange' && screen === 'KIPRAH_ALUMNI') {
    const validation = validateKiprahData(data);
    if (!validation.valid) {
      return {
        version: '3.0',
        screen: 'KIPRAH_ALUMNI',
        data: { ...data, has_error: true, validation_error: validation.message },
      };
    }

    await saveSubmission({ data, flowToken: flow_token, normalizedPhone: validation.normalizedPhone });
    return { version: '3.0', screen: 'SUCCESS', data: {} };
  }

  throw new Error(`Unhandled Flow action "${action}" on screen "${screen}"`);
}

async function saveSubmission({ data, flowToken, normalizedPhone }) {
  const waNumber = String(flowToken || '').split('::')[0];

  const photos = Array.isArray(data.foto_terbaik) ? data.foto_terbaik : [];
  console.log(`Processing ${photos.length} uploaded photo(s) for ${waNumber}`, photos[0]);

  const photoLinks = [];
  for (const [index, photo] of photos.entries()) {
    const { buffer, fileName } = await downloadAndDecryptFlowMedia(photo);
    const link = await uploadPhoto(
      buffer,
      fileName || `${waNumber}-foto-${index + 1}.jpg`,
      photo.mime_type || 'image/jpeg'
    );
    photoLinks.push(link);
  }

  await appendAlumniRow({
    timestamp: new Date().toISOString(),
    wa_number: waNumber,
    nama_lengkap: data.nama_lengkap,
    program_beasiswa: data.program_beasiswa,
    asal_kampus: data.asal_kampus,
    tahun_masuk: data.tahun_masuk,
    jurusan: data.jurusan,
    jenis_kelamin: data.jenis_kelamin,
    nomor_hp: normalizedPhone,
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
    foto_links: photoLinks.join(', '),
  });
}

module.exports = router;
