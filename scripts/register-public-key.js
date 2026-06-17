const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../src/config');

async function main() {
  const publicKeyPath = path.join(__dirname, '..', 'keys', 'public.pem');
  if (!fs.existsSync(publicKeyPath)) {
    throw new Error('keys/public.pem not found. Run "npm run generate-keys" first.');
  }
  const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

  const url = `https://graph.facebook.com/${config.whatsapp.graphApiVersion}/${config.whatsapp.phoneNumberId}/whatsapp_business_encryption`;

  const { data } = await axios.post(
    url,
    new URLSearchParams({ business_public_key: publicKey }),
    { headers: { Authorization: `Bearer ${config.whatsapp.token}` } }
  );

  console.log('Public key registered:', data);
}

main().catch((err) => {
  console.error('Failed to register public key:', err.response?.data || err.message);
  process.exit(1);
});
