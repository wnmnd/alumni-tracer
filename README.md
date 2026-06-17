# Tracer Alumni BAZNAS

WhatsApp chatbot for BAZNAS scholarship alumni tracing:

1. Alumni sends **"tracer alumni"** to the WhatsApp number.
2. The bot replies with a native **WhatsApp Flow** (in-chat form) covering Data Diri + Kiprah Saat Ini, in Bahasa Indonesia.
3. On submit, the server validates the data, uploads the photos to **Google Drive**, and appends a row to **Google Sheets**.

## How it works

- `src/server.js` - Express app with three routes: `GET/POST /webhook` (Meta webhook), `POST /flow-data-exchange` (the Flow's encrypted endpoint), `GET /healthz`.
- `flow-json/alumni_tracer_flow.json` - the Flow definition (screens, fields, validation, in Bahasa Indonesia).
- `src/whatsapp/encryption.js` - implements Meta's required RSA-OAEP + AES-128-GCM encryption for the Flow endpoint.
- `src/whatsapp/mediaDownload.js` - downloads/decrypts photos uploaded via the Flow's PhotoPicker.
- `src/google/sheets.js`, `src/google/drive.js` - append rows / upload photos.
- `src/data/alumniColumns.js` - single source of truth for the sheet/xlsx column order.
- `scripts/` - one-off setup scripts (see below).
- `templates/alumni_tracer_template.xlsx` - pre-generated header-only template, already created by `npm run generate-template`.

## Known open item

**"Alumni Program Beasiswa"** is currently a free-text field because the original spec didn't list the actual BAZNAS scholarship program names. If you give me that list, I'll convert it to a dropdown (same pattern as Provinsi) - much better data quality for analysis later.

## 1. Local setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:
- `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_BUSINESS_ACCOUNT_ID` - from the Meta details you shared. **The token you pasted in chat is the temporary test-number token, which expires in ~24 hours.** Before deploying for real use, generate a permanent token: Meta Business Settings → Users → System Users → create one, assign it to the WhatsApp app with `whatsapp_business_messaging` + `whatsapp_business_management` permissions, generate a token with no expiry.
- `WEBHOOK_VERIFY_TOKEN` - make up any string; you'll paste the same string into the Meta App Dashboard webhook config.
- `META_APP_SECRET` - optional but recommended, from Meta App Dashboard → Settings → Basic. Used to verify incoming webhook signatures.

## 2. Generate the Flow encryption key pair

```bash
npm run generate-keys          # writes keys/private.pem and keys/public.pem (gitignored)
```

Copy `keys/private.pem`'s contents into `FLOW_PRIVATE_KEY` in `.env` (multi-line is fine if quoted, or paste with literal `\n`).

```bash
npm run register-public-key    # uploads keys/public.pem to your WhatsApp phone number
```

## 3. Create the Flow on Meta

```bash
npm run create-flow
```

This creates the "Tracer Alumni BAZNAS" Flow from `flow-json/alumni_tracer_flow.json`, prints the resulting `FLOW_ID` (add it to `.env`), and shows any validation warnings from Meta. If you edit the Flow JSON later, re-push it with:

```bash
npm run update-flow
```

The Flow's `endpoint_uri` (where Meta calls back for INIT/submit) must point at your deployed server's `/flow-data-exchange` route - you can only set this once you have a public HTTPS URL (see Render section below). Once you have it:

```bash
FLOW_ENDPOINT_URL=https://your-app.onrender.com/flow-data-exchange npm run update-flow
```

For local testing before deploying, use a tunnel (e.g. `ngrok http 3000`) and point `FLOW_ENDPOINT_URL` at the ngrok HTTPS URL instead.

Once the endpoint is reachable and responds correctly to Meta's health-check ping, publish the Flow so it can be sent to real users:

```bash
npm run publish-flow
```

## 4. Configure the webhook (Meta App Dashboard)

WhatsApp → Configuration → Webhook:
- Callback URL: `https://your-app.onrender.com/webhook`
- Verify token: same value as `WEBHOOK_VERIFY_TOKEN`
- Subscribe to the `messages` field.

## 5. Google Sheets / Drive setup (you mentioned credentials come later)

1. In Google Cloud Console, create a Service Account, enable the **Google Sheets API** and **Google Drive API**.
2. Create a JSON key for it, paste the whole JSON as a single line into `GOOGLE_SERVICE_ACCOUNT_JSON` in `.env`.
3. Upload `templates/alumni_tracer_template.xlsx` to Google Sheets (or create a new Sheet and paste the header row), then **share the Sheet with the service account's email** (`...@...iam.gserviceaccount.com`) as Editor. Put the Sheet ID (from its URL) into `GOOGLE_SHEET_ID`. The tab name must match `GOOGLE_SHEET_NAME` (default `Alumni`).
4. Create a Google Drive folder for photos, **share it with the same service account email** as Editor, put its ID into `GOOGLE_DRIVE_FOLDER_ID`.

The xlsx template already has the exact columns matching the form (`templates/alumni_tracer_template.xlsx`) - regenerate it any time with `npm run generate-template` if columns change.

## 6. Run locally

```bash
npm run dev
```

Test the webhook verification handshake:
```bash
curl "http://localhost:3000/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test"
```

## 7. Deploy to Render

What I need from you to deploy:
- **A git repo** (GitHub/GitLab) to host this code - Render deploys from a connected repo, not from a local folder. Push this project there (I can do it if you give me the repo URL and want me to push).
- **A Render account**, with the repo connected.
- Either:
  - **You deploy manually** (no credentials needed from you to me): in the Render dashboard, "New +" → "Blueprint", point it at the repo (it'll pick up `render.yaml`), and Render will prompt you to fill in the `sync: false` secret env vars listed there (`WHATSAPP_TOKEN`, `FLOW_PRIVATE_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON`, etc.) directly in their dashboard - this keeps secrets out of the repo entirely.
  - **Or you give me a Render API key** (Account Settings → API Keys) and I can create/update the service and set env vars via the Render API on your behalf.
- Once deployed, take the live `https://xxx.onrender.com` URL and:
  - Set it as the Meta webhook Callback URL (`/webhook`).
  - Run `FLOW_ENDPOINT_URL=https://xxx.onrender.com/flow-data-exchange npm run update-flow` to point the Flow at it, then `npm run publish-flow`.

## Verification checklist before going live

- [ ] Permanent (non-expiring) WhatsApp token in place of the test token
- [ ] `register-public-key` succeeded (no `public-key-missing` webhook errors)
- [ ] Flow created, endpoint set, published
- [ ] Google Sheet + Drive folder shared with the service account
- [ ] Send "tracer alumni" from a real phone to confirm the Flow opens and a submission lands in the Sheet with photo links in Drive
- [ ] Double check the `foto_terbaik` payload shape in server logs on first real submission - `mediaDownload.js` was built from Meta's documented spec but couldn't be verified against a live test before deployment; adjust if the actual field names differ.
