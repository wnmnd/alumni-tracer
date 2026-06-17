const axios = require('axios');
const config = require('../config');

const graphUrl = (path) =>
  `https://graph.facebook.com/${config.whatsapp.graphApiVersion}/${path}`;

const client = axios.create({
  headers: { Authorization: `Bearer ${config.whatsapp.token}` },
});

async function sendTextMessage(to, body) {
  return client.post(graphUrl(`${config.whatsapp.phoneNumberId}/messages`), {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body },
  });
}

async function sendFlowMessage(to, { flowToken, screen, headerText, bodyText, ctaText }) {
  return client.post(graphUrl(`${config.whatsapp.phoneNumberId}/messages`), {
    messaging_product: 'whatsapp',
    to,
    recipient_type: 'individual',
    type: 'interactive',
    interactive: {
      type: 'flow',
      header: { type: 'text', text: headerText || 'Tracer Alumni BAZNAS' },
      body: {
        text:
          bodyText ||
          'Terima kasih telah menghubungi BAZNAS. Silakan isi formulir Tracer Alumni berikut ini.',
      },
      footer: { text: 'Data Anda akan tersimpan dengan aman' },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_token: flowToken,
          flow_id: config.flow.id,
          flow_cta: ctaText || 'Isi Formulir Alumni',
          flow_action: 'navigate',
          flow_action_payload: { screen: screen || 'DATA_DIRI', data: {} },
        },
      },
    },
  });
}

async function getMediaMetadata(mediaId) {
  const { data } = await client.get(graphUrl(mediaId));
  return data;
}

async function downloadMedia(url) {
  const { data } = await client.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(data);
}

module.exports = { sendTextMessage, sendFlowMessage, getMediaMetadata, downloadMedia };
