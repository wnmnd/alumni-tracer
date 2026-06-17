const axios = require('axios');
const config = require('../config');

const apiUrl = (method) => `https://api.telegram.org/bot${config.telegram.botToken}/${method}`;

async function sendMessage(chatId, text, replyMarkup) {
  return axios.post(apiUrl('sendMessage'), {
    chat_id: chatId,
    text,
    reply_markup: replyMarkup,
  });
}

async function sendFormButton(chatId) {
  const formUrl = `${config.telegram.publicBaseUrl}/telegram/form`;
  return sendMessage(
    chatId,
    'Terima kasih telah menghubungi BAZNAS. Silakan isi formulir Tracer Alumni berikut ini.',
    {
      inline_keyboard: [[{ text: 'Isi Formulir Alumni', web_app: { url: formUrl } }]],
    }
  );
}

async function setWebhook(url) {
  return axios.post(apiUrl('setWebhook'), { url });
}

async function getWebhookInfo() {
  const { data } = await axios.get(apiUrl('getWebhookInfo'));
  return data;
}

module.exports = { sendMessage, sendFormButton, setWebhook, getWebhookInfo };
