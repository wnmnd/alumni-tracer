// Columns excluded from the chatbot's raw-data context to avoid sending
// personal contact details to a third-party LLM API.
const EXCLUDED_COLUMNS = ['Nomor WhatsApp', 'Telegram Username', 'Nomor HP', 'Instagram/Facebook', 'Link Foto Terbaik'];

function escapeCsvField(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"';
  return str;
}

function rowsToCsv(rows, { maxRows } = {}) {
  if (!rows.length) return { csv: '', includedCount: 0, totalCount: 0 };

  const headers = Object.keys(rows[0]).filter((h) => !EXCLUDED_COLUMNS.includes(h));
  const limited = maxRows && rows.length > maxRows ? rows.slice(rows.length - maxRows) : rows;

  const lines = [headers.join(',')];
  for (const row of limited) {
    lines.push(headers.map((h) => escapeCsvField(row[h])).join(','));
  }

  return { csv: lines.join('\n'), includedCount: limited.length, totalCount: rows.length };
}

module.exports = { rowsToCsv };
