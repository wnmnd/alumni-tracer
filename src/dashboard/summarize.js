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

function summarize(rows) {
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
  };
}

module.exports = { summarize };
