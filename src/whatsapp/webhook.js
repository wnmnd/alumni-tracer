const express = require('express');
const config = require('../config');
const { sendTextMessage, sendFlowMessage } = require('./client');
const { isValidSignature } = require('./signature');
const { schedule } = require('../reminder/scheduler');
const { REMINDER_DELAY_MS, REMINDER_MESSAGE } = require('../reminder/constants');

const router = express.Router();

router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.webhookVerifyToken) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

router.post('/webhook', async (req, res) => {
  if (!isValidSignature(req.rawBody, req.get('X-Hub-Signature-256'))) {
    return res.sendStatus(401);
  }

  // Acknowledge immediately - Meta retries if it doesn't get a fast 200.
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages || [];

    for (const message of messages) {
      await handleMessage(message);
    }
  } catch (err) {
    console.error('Error handling webhook payload:', err.response?.data || err.message);
  }
});

async function handleMessage(message) {
  const from = message.from;

  if (message.type === 'text') {
    const text = message.text?.body?.trim().toLowerCase() || '';
    if (text.includes(config.whatsapp.triggerKeyword)) {
      const flowToken = `${from}::${Date.now()}`;
      await sendFlowMessage(from, { flowToken, screen: 'DATA_DIRI' });
      schedule(
        `wa:${from}`,
        async () => {
          const reminderToken = `${from}::${Date.now()}`;
          await sendFlowMessage(from, { flowToken: reminderToken, screen: 'DATA_DIRI', bodyText: REMINDER_MESSAGE });
        },
        REMINDER_DELAY_MS
      );
    } else {
      await sendTextMessage(
        from,
        `Halo! Ketik *"${config.whatsapp.triggerKeyword}"* untuk mengisi formulir Tracer Alumni BAZNAS.`
      );
    }
    return;
  }

  if (message.type === 'interactive' && message.interactive?.type === 'nfm_reply') {
    // Informational copy of the completed Flow submission, delivered as a chat
    // message. The actual processing/save already happened in the Flow's
    // data-exchange endpoint (see flowEndpoint.js), so this is logged only.
    console.log('Received nfm_reply confirmation from', from, message.interactive.nfm_reply);
  }
}

module.exports = router;
