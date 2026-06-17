const { google } = require('googleapis');
const config = require('../config');
const { getAuthClient } = require('./auth');
const { ALUMNI_COLUMNS } = require('../data/alumniColumns');

async function appendAlumniRow(rowData) {
  const sheets = google.sheets({ version: 'v4', auth: getAuthClient() });

  const row = ALUMNI_COLUMNS.map((col) => rowData[col.key] ?? '');

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.google.sheetId,
    range: `${config.google.sheetName}!A1`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [row] },
  });
}

module.exports = { appendAlumniRow };
