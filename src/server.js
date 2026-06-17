const express = require('express');
const config = require('./config');
const webhookRouter = require('./whatsapp/webhook');
const flowEndpointRouter = require('./whatsapp/flowEndpoint');

const app = express();

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

app.use(webhookRouter);
app.use(flowEndpointRouter);

app.listen(config.port, () => {
  console.log(`BAZNAS alumni tracer listening on port ${config.port}`);
});
