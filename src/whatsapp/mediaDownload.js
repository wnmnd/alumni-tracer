const axios = require('axios');
const crypto = require('crypto');

/**
 * Downloads and decrypts a single file uploaded through a Flow PhotoPicker/
 * DocumentPicker component. Meta delivers these via a `cdn_url` plus an
 * `encryption_metadata` block (encryption_key, hmac_key, iv, plaintext_hash,
 * encrypted_hash) rather than through the regular /media/{id} Graph API.
 *
 * NOTE: this is the one part of the integration we could not verify against
 * live Meta documentation while building this (their docs site is JS-rendered
 * and blocked automated fetches). Field names/shape are based on Meta's
 * published WhatsApp Flows media upload spec - verify against a real test
 * submission's logged payload (see flowEndpoint.js) and adjust if it differs.
 */
async function downloadAndDecryptFlowMedia(mediaItem) {
  const { cdn_url, encryption_metadata, file_name } = mediaItem;

  const { data } = await axios.get(cdn_url, { responseType: 'arraybuffer' });
  const blob = Buffer.from(data);

  const encryptionKey = Buffer.from(encryption_metadata.encryption_key, 'base64');
  const hmacKey = Buffer.from(encryption_metadata.hmac_key, 'base64');
  const iv = Buffer.from(encryption_metadata.iv, 'base64');

  const MAC_LENGTH = 10;
  const ciphertext = blob.subarray(0, blob.length - MAC_LENGTH);
  const mac = blob.subarray(blob.length - MAC_LENGTH);

  const expectedMac = crypto
    .createHmac('sha256', hmacKey)
    .update(Buffer.concat([iv, ciphertext]))
    .digest()
    .subarray(0, MAC_LENGTH);

  if (!crypto.timingSafeEqual(mac, expectedMac)) {
    throw new Error(`HMAC verification failed for uploaded file ${file_name}`);
  }

  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return { buffer: plaintext, fileName: file_name };
}

module.exports = { downloadAndDecryptFlowMedia };
