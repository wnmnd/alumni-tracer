function normalizePhone(raw) {
  let phone = String(raw || '').replace(/[^\d]/g, '');
  if (phone.startsWith('0')) phone = `62${phone.slice(1)}`;
  return phone;
}

function validateKiprahData(data) {
  const errors = [];

  const ipk = Number(data.ipk);
  if (!Number.isFinite(ipk) || ipk < 0 || ipk > 4) {
    errors.push('IPK harus berupa angka antara 0.00 - 4.00.');
  }

  const currentYear = new Date().getFullYear();
  const tahunMasuk = Number(data.tahun_masuk);
  if (!Number.isInteger(tahunMasuk) || tahunMasuk < 1990 || tahunMasuk > currentYear + 1) {
    errors.push('Tahun Masuk Beasiswa tidak valid.');
  }

  const lamaKuliah = Number(data.lama_kuliah_bulan);
  if (!Number.isInteger(lamaKuliah) || lamaKuliah <= 0) {
    errors.push('Lama Kuliah (Bulan) harus berupa angka lebih dari 0.');
  }

  const masaTunggu = Number(data.masa_tunggu_bulan);
  if (!Number.isInteger(masaTunggu) || masaTunggu < 0) {
    errors.push('Masa Tunggu (Bulan) harus berupa angka 0 atau lebih.');
  }

  const phone = normalizePhone(data.nomor_hp);
  if (!/^62\d{8,13}$/.test(phone)) {
    errors.push('Nomor HP tidak valid. Contoh: 62877111111111.');
  }

  const photos = Array.isArray(data.foto_terbaik) ? data.foto_terbaik : [];
  if (photos.length < 2 || photos.length > 5) {
    errors.push('Unggah minimal 2 dan maksimal 5 foto.');
  }

  return { valid: errors.length === 0, message: errors.join(' '), normalizedPhone: phone };
}

module.exports = { validateKiprahData, normalizePhone };
