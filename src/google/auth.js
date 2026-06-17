const { google } = require('googleapis');
const config = require('../config');

let authClient;

function getAuthClient() {
  if (authClient) return authClient;

  if (!config.google.serviceAccountJson) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON is not set. Add the service account key JSON to your .env first.'
    );
  }

  const credentials = JSON.parse(config.google.serviceAccountJson);
  authClient = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
  return authClient;
}

module.exports = { getAuthClient };
