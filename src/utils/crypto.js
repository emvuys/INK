const nacl = require('tweetnacl');
const crypto = require('crypto');

// Load keypair from hex string
function loadKeypair() {
  const privateKeyHex = process.env.ED25519_PRIVATE_KEY;
  if (!privateKeyHex) {
    throw new Error('ED25519_PRIVATE_KEY not set');
  }
  const secretKey = Buffer.from(privateKeyHex, 'hex');
  return nacl.sign.keyPair.fromSecretKey(secretKey);
}

// Sign data with Ed25519
function signData(data) {
  const keypair = loadKeypair();
  const message = JSON.stringify(data);
  const messageBytes = Buffer.from(message, 'utf8');
  const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
  return Buffer.from(signature).toString('hex');
}

// Get public key in hex format
function getPublicKey() {
  const keypair = loadKeypair();
  return Buffer.from(keypair.publicKey).toString('hex');
}

// Generate HMAC-SHA256 signature
function generateHMAC(payload) {
  const secret = process.env.HMAC_SECRET;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

module.exports = {
  signData,
  getPublicKey,
  generateHMAC
};

