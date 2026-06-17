# Tracer Alumni BAZNAS

Two intake channels for the same BAZNAS scholarship alumni tracing form, sharing one backend and one Google Sheet:

1. **WhatsApp** - alumni sends **"tracer alumni"**, bot replies with a native **WhatsApp Flow** (in-chat form).
2. **Telegram** - alumni sends **"tracer alumni"** or `/start` to **@AlumniTracer_Bot**, bot replies with a button that opens a **Mini App** form.
3. On submit, the server validates the data, then calls a **Google Apps Script Web App** bound to the Sheet, which appends the row and uploads photos to Drive.
4. A password-protected **dashboard** (`/dashboard`) visualizes the same Sheet data with charts in BAZNAS's brand colors, plus a chatbot (via OpenRouter) that can answer questions about the data.

## How it works

- `src/server.js` - Express app wiring both channels' routes plus `GET /healthz`.
- **WhatsApp**: `src/whatsapp/webhook.js` (trigger detection), `src/whatsapp/flowEndpoint.js` (the Flow's encrypted data-exchange endpoint), `src/whatsapp/encryption.js` (Meta's required RSA-OAEP + AES-128-GCM), `src/whatsapp/mediaDownload.js` (decrypts PhotoPicker uploads), `flow-json/alumni_tracer_flow.json` (the Flow definition).
- **Telegram**: `src/telegram/webhook.js` (trigger detection), `public/telegram-form/index.html` (the Mini App form), `src/telegram/submit.js` (receives the form POST), `src/telegram/verifyInitData.js` (validates Telegram's signed session data).
- **Shared**: `src/flow/validateKiprah.js` (business-rule validation used by both channels), `src/data/alumniColumns.js` (single source of truth for sheet/xlsx column order), `src/google/appsScript.js` (HTTP client for the Apps Script Web App).
- `apps-script/Code.gs` - the script to paste into the Google Sheet (see setup below).
- `templates/alumni_tracer_template.xlsx` - header-only template matching the form; regenerate with `npm run generate-template` if columns change.
- **Dashboard**: `src/dashboard/session.js` (signed-cookie auth), `src/dashboard/auth.js` (login/logout), `src/dashboard/data.js` + `dataCache.js` (reads rows from Apps Script's `list_rows` action, cached 60s), `src/dashboard/chat.js` + `summarize.js` (OpenRouter chatbot with a stats-summary system prompt), `public/dashboard/login.html` + `index.html` (the actual UI, Chart.js via CDN).

## 1. Local setup

```bash
npm install
cp .env.example .env
```

## 2. WhatsApp setup

- `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` - from Meta. **Use a permanent System User token for production** - the WhatsApp Manager test-number token expires in ~24 hours.
- `WEBHOOK_VERIFY_TOKEN` - any string; enter the same value in Meta App Dashboard → WhatsApp → Configuration → Webhook.
- `META_APP_SECRET` - optional, verifies incoming webhook signatures.

Generate and register the Flow encryption key pair:
```bash
npm run generate-keys          # writes keys/private.pem and keys/public.pem (gitignored)
npm run register-public-key    # uploads the public key to your WhatsApp phone number
```
Copy `keys/private.pem` into `FLOW_PRIVATE_KEY` in `.env`.

Create the Flow:
```bash
npm run create-flow            # prints FLOW_ID - add it to .env
```
Re-push the Flow JSON any time you edit it:
```bash
FLOW_ENDPOINT_URL=https://your-app.onrender.com/flow-data-exchange npm run update-flow
```
Once the endpoint is live and healthy, publish it so it can be sent to real users:
```bash
npm run publish-flow
```
**Note:** sending a Flow message requires the WhatsApp Business Account to have a valid payment method *and* have passed Meta's Business Verification - without both, sends fail with `(#139000) Blocked by Integrity` even though everything else works.

Configure the webhook in Meta App Dashboard → WhatsApp → Configuration:
- Callback URL: `https://your-app.onrender.com/webhook`
- Verify token: same value as `WEBHOOK_VERIFY_TOKEN`
- Subscribe to the `messages` field.

## 3. Telegram setup

- `TELEGRAM_BOT_TOKEN` - from @BotFather.
- `PUBLIC_BASE_URL` - your deployed server's HTTPS URL, e.g. `https://your-app.onrender.com`.

Point the bot's webhook at your deployed server:
```bash
npm run set-telegram-webhook
```

## 4. Google Sheet + Apps Script setup

No service account or API credentials needed - the Sheet records itself via a bound script.

1. Open your Google Sheet (e.g. import `templates/alumni_tracer_template.xlsx` via File → Import → Upload → Insert new sheet(s), keeping the tab named **"Alumni"**).
2. Extensions → Apps Script. Delete the boilerplate and paste in the contents of [apps-script/Code.gs](apps-script/Code.gs).
3. Replace the `SECRET` constant at the top with a random string (ask for one, or generate your own).
4. Deploy → New deployment → gear icon → **Web app**. Execute as **Me**, who has access **Anyone**. Deploy, and authorize the permissions prompt (it's your own account accessing your own Sheet/Drive).
5. Copy the Web app URL (ends in `/exec`).
6. Set `APPS_SCRIPT_URL` to that URL and `APPS_SCRIPT_SECRET` to the same string from step 3.

The script auto-creates a "Alumni Tracer Photos" Drive folder on first use and writes photo links back into the "Link Foto Terbaik" column. If you ever change sheet columns, the script matches by header text, not position, so reordering/adding columns is safe - just keep the header names matching `src/data/alumniColumns.js`.

Whenever you edit `Code.gs`, re-paste it into the Apps Script editor and re-deploy (Deploy → Manage deployments → edit → New version) - editing the file in this repo does not update the live script automatically.

## 5. Dashboard setup

Visit `https://your-app.onrender.com/dashboard` (redirects to `/login` if not authenticated).

- `ADMIN_USERNAME` / `ADMIN_PASSWORD` - login credentials (defaults to `admin` / `admin123` if unset - change these for anything beyond local testing).
- `SESSION_SECRET` - any random string, used to sign the session cookie.
- `OPENROUTER_API_KEY` - from [openrouter.ai/keys](https://openrouter.ai/keys). The chatbot returns a friendly "not configured" message until this is set - nothing else breaks without it.
- `OPENROUTER_MODEL` - defaults to `openrouter/free`, which auto-routes to whatever free model is currently available (avoids hardcoding a specific `:free` model slug that gets deprecated). Pin a specific model here if you want consistent behavior instead.

The chatbot's context comes from server-computed aggregate stats (counts by sector/category/province/program, averages for IPK/wait time), not the raw rows - keeps prompts small and answers grounded in real numbers instead of the model inventing figures.

Colors used (`public/dashboard/*.html`) were sampled directly from BAZNAS's public logo (green `#225312`, gold `#cd9933`) since no official hex palette was accessible - nudge me if your internal brand guide specifies different exact values.

## 6. Run locally

```bash
npm run dev
```
```bash
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
```

## 7. Deploy to Render

- Push this repo to GitHub/GitLab, connect it to Render.
- Either use the `render.yaml` Blueprint (New + → Blueprint) and fill in the `sync: false` secrets in the dashboard, or give a Render API key to have the service created/updated via the API.
- After deploying, set the WhatsApp webhook Callback URL and `FLOW_ENDPOINT_URL` (see above) to the live Render URL, and run `npm run set-telegram-webhook` with `PUBLIC_BASE_URL` pointing at it.

## Verification checklist before going live

- [ ] Permanent (non-expiring) WhatsApp token in place of the test token
- [ ] WhatsApp Business Account has a payment method on file and has passed Business Verification (required for Flow sends specifically)
- [ ] Flow created, endpoint set, published
- [ ] Apps Script deployed, `APPS_SCRIPT_URL`/`APPS_SCRIPT_SECRET` set, sheet tab named "Alumni"
- [ ] Send "tracer alumni" on both channels and confirm a row + photo links land in the Sheet
- [ ] Double-check the `foto_terbaik` payload shape in server logs on the first real WhatsApp submission - `mediaDownload.js` was built from Meta's documented spec but hasn't been verified against a live payload yet (WhatsApp sends have been blocked by the verification gate above); adjust if the actual field names differ.
- [ ] Apps Script redeployed with the `list_rows` action (needed for the dashboard) - re-paste `Code.gs` and create a new deployment version if you deployed it before this was added.
- [ ] `ADMIN_USERNAME`/`ADMIN_PASSWORD` changed from the defaults, `SESSION_SECRET` set, `OPENROUTER_API_KEY` set if you want the chatbot live.
