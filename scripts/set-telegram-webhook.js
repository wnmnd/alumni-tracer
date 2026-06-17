const config = require('../src/config');
const { setWebhook, getWebhookInfo } = require('../src/telegram/client');

async function main() {
  if (!config.telegram.publicBaseUrl) {
    throw new Error('PUBLIC_BASE_URL is not set in .env');
  }
  const url = `${config.telegram.publicBaseUrl}/telegram/webhook`;
  const { data } = await setWebhook(url);
  console.log('setWebhook result:', data);

  const info = await getWebhookInfo();
  console.log('getWebhookInfo:', JSON.stringify(info, null, 2));
}

main().catch((err) => {
  console.error('Failed to set Telegram webhook:', err.response?.data || err.message);
  process.exit(1);
});
