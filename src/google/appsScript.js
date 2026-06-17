const axios = require('axios');
const config = require('../config');
const { ALUMNI_COLUMNS } = require('../data/alumniColumns');

const client = axios.create({ timeout: 30000 });

function toHeaderKeyedRow(rowData) {
  const row = {};
  for (const col of ALUMNI_COLUMNS) {
    row[col.header] = rowData[col.key] ?? '';
  }
  return row;
}

async function appendAlumniRow(rowData) {
  const { data } = await client.post(config.appsScript.url, {
    secret: config.appsScript.secret,
    action: 'append_row',
    row: toHeaderKeyedRow(rowData),
  });
  if (!data.success) throw new Error(`Apps Script append_row failed: ${data.message}`);
  return data.rowIndex;
}

async function uploadPhotoForRow(rowIndex, buffer, filename, mimeType) {
  const { data } = await client.post(config.appsScript.url, {
    secret: config.appsScript.secret,
    action: 'add_photo',
    rowIndex,
    filename,
    mimeType,
    base64: buffer.toString('base64'),
  });
  if (!data.success) throw new Error(`Apps Script add_photo failed: ${data.message}`);
  return data.link;
}

module.exports = { appendAlumniRow, uploadPhotoForRow };
