require('dotenv').config();

function normalizePrivateKey(key) {
  if (!key) return undefined;
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
}

module.exports = {
  port: process.env.PORT || 3000,

  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    graphApiVersion: process.env.GRAPH_API_VERSION || 'v23.0',
    webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN,
    appSecret: process.env.META_APP_SECRET,
    triggerKeyword: (process.env.FLOW_TRIGGER_KEYWORD || 'tracer alumni').toLowerCase(),
  },

  flow: {
    id: process.env.FLOW_ID,
    privateKey: normalizePrivateKey(process.env.FLOW_PRIVATE_KEY),
    privateKeyPassphrase: process.env.FLOW_PRIVATE_KEY_PASSPHRASE,
  },

  google: {
    serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    sheetId: process.env.GOOGLE_SHEET_ID,
    sheetName: process.env.GOOGLE_SHEET_NAME || 'Alumni',
    driveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
  },
};
