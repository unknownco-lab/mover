// scripts/generate-test-license.js
// Run with: node scripts/generate-test-license.js

const nacl = require('tweetnacl');
const { encodeBase64, decodeUTF8 } = require('tweetnacl-util');

// Step 1: Generate a new keypair (do this once, save the keys)
console.log('=== GENERATING NEW KEYPAIR ===\n');
const keypair = nacl.sign.keyPair();

const privateKeyB64 = Buffer.from(keypair.secretKey).toString('base64');
const publicKeyB64 = Buffer.from(keypair.publicKey).toString('base64');

console.log('Private Key (KEEP SECRET - store in Vercel env):');
console.log(privateKeyB64);
console.log('\nPublic Key (put in electron/license/publicKey.ts):');
console.log(publicKeyB64);
console.log('\n');

// Step 2: Generate a test license key
console.log('=== GENERATING TEST LICENSE ===\n');

const payload = {
  email: 'test@example.com',
  licenseId: 'test-' + Date.now(),
  issuedAt: Math.floor(Date.now() / 1000),
  expiresAt: null, // lifetime license
  product: 'mover',
  version: '1'
};

const payloadStr = JSON.stringify(payload);
const payloadBytes = decodeUTF8(payloadStr);

// Sign the payload
const signature = nacl.sign.detached(payloadBytes, keypair.secretKey);

// Encode to base64url
function toBase64Url(uint8array) {
  const base64 = Buffer.from(uint8array).toString('base64');
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

const payloadB64 = toBase64Url(Buffer.from(payloadStr));
const signatureB64 = toBase64Url(signature);

const licenseKey = `MOVER-${payloadB64}.${signatureB64}`;

console.log('Test License Key:');
console.log(licenseKey);
console.log('\n');
console.log('Payload:');
console.log(JSON.stringify(payload, null, 2));
console.log('\n');

// Step 3: Verify the license (simulate validation)
console.log('=== VERIFYING LICENSE ===\n');

function fromBase64Url(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64');
}

const verifyPayloadBytes = decodeUTF8(payloadStr);
const verifySignature = fromBase64Url(signatureB64);
const isValid = nacl.sign.detached.verify(
  verifyPayloadBytes,
  verifySignature,
  keypair.publicKey
);

console.log('Signature Valid:', isValid ? '✓ YES' : '✗ NO');
console.log('\n');

// Instructions
console.log('=== NEXT STEPS ===\n');
console.log('1. Copy the Public Key and paste it into electron/license/publicKey.ts');
console.log('2. Save the Private Key in your password manager or Vercel env vars');
console.log('3. Copy the Test License Key and use it to test activation in your app');
console.log('4. Run: npm install electron-store tweetnacl tweetnacl-util');