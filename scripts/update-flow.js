const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../src/config');

const FLOW_JSON_PATH = path.join(__dirname, '..', 'flow-json', 'alumni_tracer_flow.json');
const baseUrl = `https://graph.facebook.com/${config.whatsapp.graphApiVersion}`;
const headers = { Authorization: `Bearer ${config.whatsapp.token}` };

async function main() {
  if (!config.flow.id) {
    throw new Error('FLOW_ID is not set in .env. Run "npm run create-flow" first.');
  }

  const flowJson = fs.readFileSync(FLOW_JSON_PATH, 'utf8');
  const form = new FormData();
  form.append('asset_type', 'FLOW_JSON');
  form.append('name', 'flow.json');
  form.append('file', new Blob([flowJson], { type: 'application/json' }), 'flow.json');

  console.log('Re-uploading Flow JSON for', config.flow.id);
  const { data } = await axios.post(`${baseUrl}/${config.flow.id}/assets`, form, { headers });
  console.log('Upload result:', JSON.stringify(data, null, 2));

  if (process.env.FLOW_ENDPOINT_URL) {
    console.log('Setting endpoint_uri to', process.env.FLOW_ENDPOINT_URL);
    await axios.post(
      `${baseUrl}/${config.flow.id}`,
      { endpoint_uri: process.env.FLOW_ENDPOINT_URL },
      { headers }
    );
  }
}

main().catch((err) => {
  console.error('Failed to update flow:', err.response?.data || err.message);
  process.exit(1);
});
