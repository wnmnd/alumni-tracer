// One-off utility to seed the Google Sheet with synthetic alumni rows for
// testing analysis/dashboards before real submissions exist. Rows are marked
// with Channel = "Mock" so they're trivially filterable/deletable later.
const { appendAlumniRow } = require('../src/google/appsScript');

const COUNT = Number(process.argv[2]) || 100;

const FIRST_NAMES_MALE = [
  'Ahmad', 'Muhammad', 'Budi', 'Andi', 'Eko', 'Rizki', 'Fajar', 'Dedi', 'Agus', 'Hendra',
  'Bambang', 'Wahyu', 'Joko', 'Dimas', 'Yusuf', 'Taufik', 'Irfan', 'Bayu', 'Arif', 'Galih',
];
const FIRST_NAMES_FEMALE = [
  'Siti', 'Dewi', 'Putri', 'Rina', 'Sri', 'Wulan', 'Indah', 'Lestari', 'Ayu', 'Maya',
  'Nur', 'Fitria', 'Ratna', 'Yuni', 'Dian', 'Anisa', 'Lina', 'Sari', 'Wahyuni', 'Eka',
];
const LAST_NAMES = [
  'Santoso', 'Wijaya', 'Pratama', 'Saputra', 'Hidayat', 'Nugroho', 'Setiawan', 'Permana',
  'Kurniawan', 'Lestari', 'Rahmawati', 'Susanto', 'Wibowo', 'Hakim', 'Maulana', 'Firmansyah',
  'Gunawan', 'Suryadi', 'Handayani', 'Mahendra',
];

const UNIVERSITAS = [
  'Universitas Indonesia', 'Institut Teknologi Bandung', 'Universitas Gadjah Mada',
  'Universitas Airlangga', 'Institut Pertanian Bogor', 'Universitas Diponegoro',
  'Universitas Brawijaya', 'Universitas Padjadjaran', 'UIN Syarif Hidayatullah Jakarta',
  'UIN Walisongo', 'IAIN Ponorogo', 'Universitas Sebelas Maret', 'Universitas Negeri Yogyakarta',
  'Universitas Hasanuddin', 'Universitas Sumatera Utara', 'Universitas Andalas',
  'Universitas Sriwijaya', 'Universitas Negeri Malang', 'Universitas Pendidikan Indonesia',
  'Institut Teknologi Sepuluh Nopember',
];

const JURUSAN = [
  'Teknik Informatika', 'Manajemen', 'Akuntansi', 'Pendidikan Agama Islam', 'Hukum',
  'Kedokteran', 'Ilmu Komunikasi', 'Teknik Sipil', 'Ekonomi Syariah', 'Psikologi',
  'Ilmu Pemerintahan', 'Agroteknologi', 'Teknik Elektro', 'Farmasi', 'Sastra Inggris',
  'Pendidikan Matematika', 'Hubungan Internasional', 'Teknik Industri', 'Agribisnis', 'Ilmu Gizi',
];

const PROGRAM_BEASISWA = [
  'Beasiswa Cendekia BAZNAS - Dalam Negeri',
  "Beasiswa Cendekia BAZNAS - Ma'had Aly",
  'Beasiswa Cendekia BAZNAS - Luar Negeri',
  'Kaderisasi Seribu Ulama',
  'Beasiswa Riset BAZNAS - Kategori Umum',
  'Beasiswa Riset BAZNAS - Kategori Mazawa',
  'Satu Keluarga Satu Sarjana',
  'Selamatkan Tunas Bangsa',
  'Beasiswa Filantropi Islam',
  'Kemitraan BAZNAS - NU Scholarship',
  'Kemitraan BAZNAS - Muhammadiyah',
  'Kemitraan BAZNAS - PERSIS',
  'Kemitraan - Syarikat Islam',
];

const PROVINSI_CITY = [
  ['Aceh', 'Banda Aceh'], ['Sumatera Utara', 'Medan'], ['Sumatera Barat', 'Padang'],
  ['Riau', 'Pekanbaru'], ['Kepulauan Riau', 'Batam'], ['Jambi', 'Jambi'],
  ['Bengkulu', 'Bengkulu'], ['Sumatera Selatan', 'Palembang'],
  ['Kepulauan Bangka Belitung', 'Pangkal Pinang'], ['Lampung', 'Bandar Lampung'],
  ['DKI Jakarta', 'Jakarta Selatan'], ['Jawa Barat', 'Bandung'], ['Banten', 'Tangerang'],
  ['Jawa Tengah', 'Semarang'], ['Daerah Istimewa Yogyakarta', 'Yogyakarta'],
  ['Jawa Timur', 'Surabaya'], ['Bali', 'Denpasar'], ['Nusa Tenggara Barat', 'Mataram'],
  ['Nusa Tenggara Timur', 'Kupang'], ['Kalimantan Barat', 'Pontianak'],
  ['Kalimantan Tengah', 'Palangkaraya'], ['Kalimantan Selatan', 'Banjarmasin'],
  ['Kalimantan Timur', 'Samarinda'], ['Kalimantan Utara', 'Tarakan'],
  ['Sulawesi Utara', 'Manado'], ['Gorontalo', 'Gorontalo'], ['Sulawesi Tengah', 'Palu'],
  ['Sulawesi Barat', 'Mamuju'], ['Sulawesi Selatan', 'Makassar'],
  ['Sulawesi Tenggara', 'Kendari'], ['Maluku', 'Ambon'], ['Maluku Utara', 'Ternate'],
  ['Papua', 'Jayapura'], ['Papua Barat', 'Manokwari'], ['Papua Tengah', 'Nabire'],
  ['Papua Pegunungan', 'Wamena'], ['Papua Selatan', 'Merauke'],
  ['Papua Barat Daya', 'Sorong'],
];

const PENDAPATAN_BRACKETS = [
  '< Rp. 1.000.000', 'Rp. 1.000.000 - Rp. 2.000.000', 'Rp. 2.000.000 - Rp. 3.000.000',
  'Rp. 3.000.000 - Rp. 4.000.000', 'Rp. 4.000.000 - Rp. 5.000.000', 'Rp. 5.000.000 - Rp. 6.000.000',
  'Rp. 6.000.000 - Rp. 7.000.000', 'Rp. 7.000.000 - Rp. 8.000.000', 'Rp. 8.000.000 - Rp. 9.000.000',
  'Rp. 9.000.000 - Rp. 10.000.000', 'Rp. 10.000.000 - Rp. 12.000.000',
  'Rp. 12.000.000 - Rp. 15.000.000', '> Rp. 15.000.000',
];

const KATA_MOTIVASI = [
  'Beasiswa ini menjadi titik balik dalam hidup saya untuk terus berkarya dan bermanfaat bagi umat.',
  'Saya bertekad untuk membalas kebaikan BAZNAS dengan terus berkontribusi kepada masyarakat.',
  'Pendidikan adalah jalan terbaik untuk mengangkat derajat keluarga dan bangsa.',
  'Terima kasih BAZNAS, beasiswa ini membuka banyak pintu kesempatan bagi saya.',
  'Saya ingin menjadi pribadi yang bermanfaat dan terus belajar sepanjang hayat.',
  'Dukungan BAZNAS memotivasi saya untuk tidak pernah menyerah dalam menggapai cita-cita.',
  'Ilmu yang saya dapatkan akan saya gunakan untuk membangun daerah asal saya.',
  'Semoga kesuksesan ini bisa menginspirasi adik-adik penerima beasiswa selanjutnya.',
  'Saya bersyukur dapat menyelesaikan studi dan kini siap berkontribusi untuk umat.',
  'Mari terus belajar dan berbagi, karena ilmu yang bermanfaat adalah sedekah yang tak putus.',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pad2(n) {
  return String(n).padStart(2, '0');
}

function buildKiprah(sektor) {
  if (sektor === 'Belum Bekerja') {
    return {
      kategori_sektor: 'Belum Bekerja',
      tempat_bekerja: '-',
      posisi_jabatan: '-',
      pendapatan: '< Rp. 1.000.000',
      masa_tunggu_bulan: randInt(6, 36),
      jobdesk_singkat: 'Belum bekerja, saat ini sedang mencari pekerjaan yang sesuai.',
    };
  }
  if (sektor === 'Lanjut Studi') {
    return {
      kategori_sektor: 'S2/S3',
      tempat_bekerja: `${pick(UNIVERSITAS)} (Pascasarjana)`,
      posisi_jabatan: 'Mahasiswa Pascasarjana',
      pendapatan: pick(['< Rp. 1.000.000', 'Rp. 1.000.000 - Rp. 2.000.000']),
      masa_tunggu_bulan: randInt(0, 6),
      jobdesk_singkat: 'Melanjutkan studi pascasarjana sambil menjadi asisten riset/pengajar.',
    };
  }
  if (sektor === 'Sektor Privat') {
    const kategori = pick(['Swasta', 'Berwirausaha', 'Professional', 'BUMN/BUMD']);
    const tempat = {
      Swasta: pick(['PT Maju Bersama', 'PT Cipta Karya Teknologi', 'PT Sinar Abadi', 'PT Nusantara Digital']),
      Berwirausaha: `Usaha Mandiri - ${pick(['Kuliner', 'Konveksi', 'Digital Marketing', 'Retail'])}`,
      Professional: pick(['Praktik Mandiri', 'Kantor Konsultan Hukum', 'Klinik Pratama']),
      'BUMN/BUMD': pick(['PT Pertamina (Persero)', 'PT Telkom Indonesia', 'PT Bank Mandiri', 'Bank Pembangunan Daerah']),
    }[kategori];
    const posisi = {
      Swasta: pick(['Staff', 'Supervisor', 'Manager', 'Analyst']),
      Berwirausaha: 'Founder',
      Professional: pick(['Konsultan', 'Praktisi']),
      'BUMN/BUMD': pick(['Staff', 'Officer', 'Supervisor']),
    }[kategori];
    return {
      kategori_sektor: kategori,
      tempat_bekerja: tempat,
      posisi_jabatan: posisi,
      pendapatan: pick(PENDAPATAN_BRACKETS.slice(2, 11)),
      masa_tunggu_bulan: randInt(0, 12),
      jobdesk_singkat: `Bertanggung jawab pada operasional dan pengembangan di bidang ${pick(JURUSAN).toLowerCase()}.`,
    };
  }
  // Sektor Publik
  const kategori = pick(['PNS/P3K/Lembaga Negara', 'Guru/Tenaga Kependidikan', 'LSM/NGO']);
  const tempat = {
    'PNS/P3K/Lembaga Negara': pick(['Kementerian Agama', 'Pemerintah Kabupaten', 'Badan Pusat Statistik', 'Dinas Sosial']),
    'Guru/Tenaga Kependidikan': pick(['SMA Negeri 1', 'SMP Negeri 3', 'MAN 2', 'SDIT Cendekia']),
    'LSM/NGO': pick(['Yayasan Peduli Umat', 'LSM Bina Bangsa', 'Dompet Sosial Madani']),
  }[kategori];
  const posisi = {
    'PNS/P3K/Lembaga Negara': pick(['Staff', 'Analis Kebijakan', 'P3K']),
    'Guru/Tenaga Kependidikan': 'Guru',
    'LSM/NGO': 'Program Officer',
  }[kategori];
  return {
    kategori_sektor: kategori,
    tempat_bekerja: tempat,
    posisi_jabatan: posisi,
    pendapatan: pick(PENDAPATAN_BRACKETS.slice(1, 7)),
    masa_tunggu_bulan: randInt(0, 18),
    jobdesk_singkat: `Menjalankan tugas pelayanan publik di bidang ${pick(JURUSAN).toLowerCase()}.`,
  };
}

function randomDateWithinLastMonths(months) {
  const now = Date.now();
  const past = now - randInt(0, months * 30) * 86400000;
  return new Date(past);
}

function buildRow() {
  const gender = pick(['Laki - Laki', 'Perempuan']);
  const firstName = gender === 'Laki - Laki' ? pick(FIRST_NAMES_MALE) : pick(FIRST_NAMES_FEMALE);
  const lastName = pick(LAST_NAMES);
  const namaLengkap = `${firstName} ${lastName}`.toUpperCase();

  const tahunMasuk = randInt(2012, 2022);
  const lamaKuliahBulan = randInt(42, 60);
  const lulusDate = new Date(tahunMasuk, 0, 1);
  lulusDate.setMonth(lulusDate.getMonth() + lamaKuliahBulan);
  const tanggalLulus = `${lulusDate.getFullYear()}-${pad2(lulusDate.getMonth() + 1)}-${pad2(lulusDate.getDate())}`;

  const [provinsi, domisili] = pick(PROVINSI_CITY);
  const ipk = (randInt(275, 395) / 100).toFixed(2);
  const handle = `${firstName}${lastName}`.toLowerCase();
  const nomorHp = `628${String(randInt(100000000, 999999999))}`;

  const sektor = pick([
    'Sektor Privat', 'Sektor Privat', 'Sektor Privat',
    'Sektor Publik', 'Sektor Publik',
    'Lanjut Studi',
    'Belum Bekerja',
  ]);
  const kiprah = buildKiprah(sektor);

  const timestamp = randomDateWithinLastMonths(18).toISOString();

  return {
    timestamp,
    channel: 'Mock',
    wa_number: '',
    telegram_username: '',
    nama_lengkap: namaLengkap,
    program_beasiswa: pick(PROGRAM_BEASISWA),
    asal_kampus: pick(UNIVERSITAS),
    tahun_masuk: tahunMasuk,
    jurusan: pick(JURUSAN),
    jenis_kelamin: gender,
    nomor_hp: nomorHp,
    domisili,
    provinsi,
    instagram_facebook: `@${handle}${randInt(1, 999)}`,
    tanggal_lulus: tanggalLulus,
    ipk,
    lama_kuliah_bulan: lamaKuliahBulan,
    masa_tunggu_bulan: kiprah.masa_tunggu_bulan,
    sektor_pekerjaan: sektor,
    kategori_sektor: kiprah.kategori_sektor,
    tempat_bekerja: kiprah.tempat_bekerja,
    posisi_jabatan: kiprah.posisi_jabatan,
    pendapatan: kiprah.pendapatan,
    jobdesk_singkat: kiprah.jobdesk_singkat,
    kata_motivasi: pick(KATA_MOTIVASI),
    foto_links: '',
  };
}

async function main() {
  console.log(`Seeding ${COUNT} mock rows (Channel = "Mock") into the Sheet...`);
  for (let i = 1; i <= COUNT; i++) {
    const row = buildRow();
    await appendAlumniRow(row);
    if (i % 10 === 0 || i === COUNT) console.log(`  ${i}/${COUNT} done`);
  }
  console.log('Done. Filter Channel = "Mock" in the Sheet to review or bulk-delete these rows later.');
}

main().catch((err) => {
  console.error('Failed to seed mock data:', err.message);
  process.exit(1);
});
