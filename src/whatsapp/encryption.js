const crypto = require('crypto');

const AES_ALGO = 'aes-128-gcm';

function decryptRequest(body, privateKeyPem, passphrase) {
  const { encrypted_flow_data, encrypted_aes_key, initial_vector } = body;

  const aesKey = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      passphrase: passphrase || undefined,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(encrypted_aes_key, 'base64')
  );

  const iv = Buffer.from(initial_vector, 'base64');
  const flowDataBuffer = Buffer.from(encrypted_flow_data, 'base64');
  const TAG_LENGTH = 16;
  const ciphertext = flowDataBuffer.subarray(0, flowDataBuffer.length - TAG_LENGTH);
  const authTag = flowDataBuffer.subarray(flowDataBuffer.length - TAG_LENGTH);

  const decipher = crypto.createDecipheriv(AES_ALGO, aesKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return {
    decryptedBody: JSON.parse(decrypted.toString('utf8')),
    aesKey,
    iv,
  };
}

// Meta requires the response IV to be the request IV with every bit flipped.
function flipIv(iv) {
  return Buffer.from(iv.map((byte) => ~byte & 0xff));
}

// Response must be the raw base64 string (text/plain), not a JSON-wrapped object.
function encryptResponse(responseObject, aesKey, requestIv) {
  const flippedIv = flipIv(requestIv);
  const cipher = crypto.createCipheriv(AES_ALGO, aesKey, flippedIv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(responseObject), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([encrypted, authTag]).toString('base64');
}

module.exports = { decryptRequest, encryptResponse };
