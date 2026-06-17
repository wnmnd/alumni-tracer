const PENDAPATAN_MIDPOINT_JUTA = {
  '< Rp. 1.000.000': 0.5,
  'Rp. 1.000.000 - Rp. 2.000.000': 1.5,
  'Rp. 2.000.000 - Rp. 3.000.000': 2.5,
  'Rp. 3.000.000 - Rp. 4.000.000': 3.5,
  'Rp. 4.000.000 - Rp. 5.000.000': 4.5,
  'Rp. 5.000.000 - Rp. 6.000.000': 5.5,
  'Rp. 6.000.000 - Rp. 7.000.000': 6.5,
  'Rp. 7.000.000 - Rp. 8.000.000': 7.5,
  'Rp. 8.000.000 - Rp. 9.000.000': 8.5,
  'Rp. 9.000.000 - Rp. 10.000.000': 9.5,
  'Rp. 10.000.000 - Rp. 12.000.000': 11,
  'Rp. 12.000.000 - Rp. 15.000.000': 13.5,
  '> Rp. 15.000.000': 17,
};

function countBy(rows, header) {
  const counts = {};
  for (const row of rows) {
    const value = row[header] || '(kosong)';
    counts[value] = (counts[value] || 0) + 1;
  }
  return counts;
}

function average(rows, header) {
  const values = rows.map((r) => Number(r[header])).filter((v) => Number.isFinite(v));
  if (!values.length) return null;
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
}

function topN(counts, n) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

function employmentRatePercent(rows) {
  if (!rows.length) return null;
  const employed = rows.filter((r) => r['Sektor Pekerjaan'] && r['Sektor Pekerjaan'] !== 'Belum Bekerja').length;
  return Number(((employed / rows.length) * 100).toFixed(1));
}

function averagePendapatanJuta(rows) {
  const values = rows.map((r) => PENDAPATAN_MIDPOINT_JUTA[r['Pendapatan']]).filter((v) => v !== undefined);
  if (!values.length) return null;
  return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
}

function groupBy(rows, header) {
  const groups = {};
  for (const row of rows) {
    const key = row[header] || '(kosong)';
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  }
  return groups;
}

// Single-group outcome metrics, reused both standalone (e.g. luar negeri vs
// dalam negeri) and per-key when grouping (e.g. per program beasiswa).
function outcomesForRows(rows) {
  return {
    jumlah_alumni: rows.length,
    rata_rata_ipk: average(rows, 'IPK'),
    rata_rata_masa_tunggu_bulan: average(rows, 'Masa Tunggu (Bulan)'),
    persentase_sudah_bekerja_atau_lanjut_studi: employmentRatePercent(rows),
    rata_rata_pendapatan_juta_estimasi: averagePendapatanJuta(rows),
  };
}

function outcomesByGroup(rows, header) {
  const groups = groupBy(rows, header);
  const result = {};
  for (const [key, groupRows] of Object.entries(groups)) {
    result[key] = outcomesForRows(groupRows);
  }
  return result;
}

function summarize(rows) {
  const luarNegeriRows = rows.filter((r) => (r['Alumni Program Beasiswa'] || '').includes('Luar Negeri'));
  const lainnyaRows = rows.filter((r) => !(r['Alumni Program Beasiswa'] || '').includes('Luar Negeri'));

  return {
    total_alumni: rows.length,
    per_sektor_pekerjaan: countBy(rows, 'Sektor Pekerjaan'),
    per_kategori_sektor: countBy(rows, 'Kategori Sektor'),
    per_jenis_kelamin: countBy(rows, 'Jenis Kelamin'),
    per_pendapatan: countBy(rows, 'Pendapatan'),
    top_5_provinsi: topN(countBy(rows, 'Provinsi'), 5),
    top_5_program_beasiswa: topN(countBy(rows, 'Alumni Program Beasiswa'), 5),
    rata_rata_ipk: average(rows, 'IPK'),
    rata_rata_masa_tunggu_bulan: average(rows, 'Masa Tunggu (Bulan)'),
    rata_rata_lama_kuliah_bulan: average(rows, 'Lama Kuliah (Bulan)'),
    // Outcome metrics per program/grouping, for strategy-style questions
    // (which program performs best, should funding shift abroad vs local, etc).
    // "rata_rata_pendapatan_juta_estimasi" is the average of each income
    // bracket's rough midpoint in millions of Rupiah - an estimate, not exact.
    outcome_per_program_beasiswa: outcomesByGroup(rows, 'Alumni Program Beasiswa'),
    perbandingan_program_luar_negeri_vs_lainnya: {
      program_luar_negeri: outcomesForRows(luarNegeriRows),
      program_dalam_negeri_dan_lainnya: outcomesForRows(lainnyaRows),
    },
  };
}

module.exports = { summarize };
