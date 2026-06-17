const path = require('path');
const express = require('express');
const config = require('./config');
const webhookRouter = require('./whatsapp/webhook');
const flowEndpointRouter = require('./whatsapp/flowEndpoint');
const telegramWebhookRouter = require('./telegram/webhook');
const telegramSubmitRouter = require('./telegram/submit');

const app = express();

app.use('/telegram/form', express.static(path.join(__dirname, '..', 'public', 'telegram-form')));

// Flow data-exchange bodies are encrypted JSON; webhook bodies need the raw
// buffer too, to verify Meta's X-Hub-Signature-256 header.
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.get('/healthz', (_req, res) => res.send('ok'));
app.get('/telegram/ping', (_req, res) => res.send('telegram-ping-ok'));

app.use(webhookRouter);
app.use(flowEndpointRouter);
app.use(telegramWebhookRouter);
app.use(telegramSubmitRouter);

app.listen(config.port, () => {
  console.log(`BAZNAS alumni tracer listening on port ${config.port}`);
});
