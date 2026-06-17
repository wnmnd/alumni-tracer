const { google } = require('googleapis');
const { Readable } = require('stream');
const config = require('../config');
const { getAuthClient } = require('./auth');

async function uploadPhoto(buffer, fileName, mimeType) {
  const drive = google.drive({ version: 'v3', auth: getAuthClient() });

  const { data: file } = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: config.google.driveFolderId ? [config.google.driveFolderId] : undefined,
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id, webViewLink',
  });

  await drive.permissions.create({
    fileId: file.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;
}

module.exports = { uploadPhoto };
