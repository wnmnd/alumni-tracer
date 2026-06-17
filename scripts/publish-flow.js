const axios = require('axios');
const config = require('../src/config');

async function main() {
  if (!config.flow.id) {
    throw new Error('FLOW_ID is not set in .env. Run "npm run create-flow" first.');
  }

  const url = `https://graph.facebook.com/${config.whatsapp.graphApiVersion}/${config.flow.id}/publish`;
  const { data } = await axios.post(url, {}, {
    headers: { Authorization: `Bearer ${config.whatsapp.token}` },
  });

  console.log('Flow published:', data);
}

main().catch((err) => {
  console.error('Failed to publish flow:', err.response?.data || err.message);
  process.exit(1);
});
