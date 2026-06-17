// Single source of truth for the Google Sheet / xlsx template column order.
// `key` must match the field names used in the Flow JSON and flowEndpoint.js.
const ALUMNI_COLUMNS = [
  { key: 'timestamp', header: 'Timestamp' },
  { key: 'wa_number', header: 'Nomor WhatsApp' },
  { key: 'nama_lengkap', header: 'Nama Lengkap' },
  { key: 'program_beasiswa', header: 'Alumni Program Beasiswa' },
  { key: 'asal_kampus', header: 'Asal Kampus' },
  { key: 'tahun_masuk', header: 'Tahun Masuk Beasiswa' },
  { key: 'jurusan', header: 'Jurusan' },
  { key: 'jenis_kelamin', header: 'Jenis Kelamin' },
  { key: 'nomor_hp', header: 'Nomor HP' },
  { key: 'domisili', header: 'Domisili' },
  { key: 'provinsi', header: 'Provinsi' },
  { key: 'instagram_facebook', header: 'Instagram/Facebook' },
  { key: 'tanggal_lulus', header: 'Tanggal Lulus Pendidikan dengan Beasiswa BAZNAS' },
  { key: 'ipk', header: 'IPK' },
  { key: 'lama_kuliah_bulan', header: 'Lama Kuliah (Bulan)' },
  { key: 'masa_tunggu_bulan', header: 'Masa Tunggu (Bulan)' },
  { key: 'sektor_pekerjaan', header: 'Sektor Pekerjaan' },
  { key: 'kategori_sektor', header: 'Kategori Sektor' },
  { key: 'tempat_bekerja', header: 'Tempat Bekerja' },
  { key: 'posisi_jabatan', header: 'Posisi/Jabatan di Tempat Kerja' },
  { key: 'pendapatan', header: 'Pendapatan' },
  { key: 'jobdesk_singkat', header: 'Jobdesk Singkat' },
  { key: 'kata_motivasi', header: 'Kata-Kata Motivasi' },
  { key: 'foto_links', header: 'Link Foto Terbaik' },
];

module.exports = { ALUMNI_COLUMNS };
