const express = require('express');
const config = require('../config');
const { sendMessage, sendFormButton } = require('./client');
const { schedule } = require('../reminder/scheduler');
const { REMINDER_DELAY_MS, REMINDER_MESSAGE } = require('../reminder/constants');

const router = express.Router();

router.post('/telegram/webhook', async (req, res) => {
  res.sendStatus(200);

  try {
    const message = req.body.message;
    if (!message || !message.text) return;

    const chatId = message.chat.id;
    const text = message.text.trim().toLowerCase();

    if (text === '/start' || text.includes(config.telegram.triggerKeyword)) {
      await sendFormButton(chatId);
      schedule(`tg:${chatId}`, () => sendFormButton(chatId, REMINDER_MESSAGE), REMINDER_DELAY_MS);
    } else {
      await sendMessage(
        chatId,
        `Halo! Ketik *"${config.telegram.triggerKeyword}"* untuk mengisi formulir Tracer Alumni BAZNAS.`
      );
    }
  } catch (err) {
    console.error('Error handling Telegram webhook:', err.response?.data || err.message);
  }
});

module.exports = router;
