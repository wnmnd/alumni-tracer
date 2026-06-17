const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../src/config');

const FLOW_JSON_PATH = path.join(__dirname, '..', 'flow-json', 'alumni_tracer_flow.json');
const baseUrl = `https://graph.facebook.com/${config.whatsapp.graphApiVersion}`;
const headers = { Authorization: `Bearer ${config.whatsapp.token}` };

async function createFlow() {
  const { data } = await axios.post(
    `${baseUrl}/${config.whatsapp.businessAccountId}/flows`,
    { name: 'Tracer Alumni BAZNAS', categories: ['SURVEY'] },
    { headers }
  );
  return data.id;
}

async function uploadFlowJson(flowId) {
  const flowJson = fs.readFileSync(FLOW_JSON_PATH, 'utf8');
  const form = new FormData();
  form.append('asset_type', 'FLOW_JSON');
  form.append('name', 'flow.json');
  form.append('file', new Blob([flowJson], { type: 'application/json' }), 'flow.json');

  const { data } = await axios.post(`${baseUrl}/${flowId}/assets`, form, { headers });
  return data;
}

async function setEndpointUri(flowId, endpointUri) {
  return axios.post(`${baseUrl}/${flowId}`, { endpoint_uri: endpointUri }, { headers });
}

async function main() {
  console.log('Creating Flow "Tracer Alumni BAZNAS"...');
  const flowId = await createFlow();
  console.log('Created Flow ID:', flowId);

  console.log('Uploading Flow JSON...');
  const uploadResult = await uploadFlowJson(flowId);
  console.log('Upload result:', JSON.stringify(uploadResult, null, 2));

  if (process.env.FLOW_ENDPOINT_URL) {
    console.log('Setting endpoint_uri to', process.env.FLOW_ENDPOINT_URL);
    await setEndpointUri(flowId, process.env.FLOW_ENDPOINT_URL);
  } else {
    console.log(
      'No FLOW_ENDPOINT_URL env var set - skipping endpoint_uri configuration.\n' +
        'Run: FLOW_ENDPOINT_URL=https://your-app.onrender.com/flow-data-exchange npm run update-flow'
    );
  }

  console.log('\nDone. Add this to your .env:');
  console.log(`FLOW_ID=${flowId}`);
}

main().catch((err) => {
  console.error('Failed to create flow:', err.response?.data || err.message);
  process.exit(1);
});
