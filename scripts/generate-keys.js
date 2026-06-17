const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const keysDir = path.join(__dirname, '..', 'keys');
fs.mkdirSync(keysDir, { recursive: true });

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey);
fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey);

console.log('Generated RSA key pair in ./keys (gitignored).');
console.log('Next steps:');
console.log('1. Paste the contents of keys/private.pem into the FLOW_PRIVATE_KEY value in your .env');
console.log('2. Run "npm run register-public-key" to upload keys/public.pem to Meta');
