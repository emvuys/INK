const nacl = require('tweetnacl');
const crypto = require('crypto');

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Load keypair from hex string
function loadKeypair() {
  try {
    const privateKeyHex = process.env.ED25519_PRIVATE_KEY;
    if (!privateKeyHex) {
      throw new Error('ED25519_PRIVATE_KEY not set');
    }
    const secretKey = Buffer.from(privateKeyHex, 'hex');
    const keypair = nacl.sign.keyPair.fromSecretKey(secretKey);
    
    if (isDevelopment) {
      console.log('[CRYPTO] Keypair loaded successfully');
      console.log('[CRYPTO] Public key (first 16 chars):', Buffer.from(keypair.publicKey).toString('hex').substring(0, 16) + '...');
    }
    
    return keypair;
  } catch (error) {
    console.error('[CRYPTO ERROR] Failed to load keypair:', error.message);
    if (isDevelopment) {
      console.error('[CRYPTO ERROR] Stack:', error.stack);
    }
    throw error;
  }
}

// Sign data with Ed25519
function signData(data) {
  try {
    if (isDevelopment) {
      console.log('[CRYPTO] Signing data with Ed25519');
      console.log('[CRYPTO] Data to sign:', JSON.stringify(data, null, 2));
    }
    
    const keypair = loadKeypair();
    const message = JSON.stringify(data);
    const messageBytes = Buffer.from(message, 'utf8');
    const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
    const signatureHex = Buffer.from(signature).toString('hex');
    
    if (isDevelopment) {
      console.log('[CRYPTO] Signature generated successfully');
      console.log('[CRYPTO] Signature (first 32 chars):', signatureHex.substring(0, 32) + '...');
      console.log('[CRYPTO] Message length:', messageBytes.length, 'bytes');
    }
    
    return signatureHex;
  } catch (error) {
    console.error('[CRYPTO ERROR] Failed to sign data:', error.message);
    if (isDevelopment) {
      console.error('[CRYPTO ERROR] Stack:', error.stack);
      console.error('[CRYPTO ERROR] Data:', JSON.stringify(data, null, 2));
    }
    throw error;
  }
}

// Get public key in hex format
function getPublicKey() {
  try {
    const keypair = loadKeypair();
    const publicKeyHex = Buffer.from(keypair.publicKey).toString('hex');
    
    if (isDevelopment) {
      console.log('[CRYPTO] Public key retrieved');
      console.log('[CRYPTO] Public key (first 16 chars):', publicKeyHex.substring(0, 16) + '...');
    }
    
    return publicKeyHex;
  } catch (error) {
    console.error('[CRYPTO ERROR] Failed to get public key:', error.message);
    if (isDevelopment) {
      console.error('[CRYPTO ERROR] Stack:', error.stack);
    }
    throw error;
  }
}

// Generate HMAC-SHA256 signature
function generateHMAC(payload) {
  try {
    const secret = process.env.HMAC_SECRET;
    if (!secret) {
      throw new Error('HMAC_SECRET not set');
    }
    
    if (isDevelopment) {
      console.log('[CRYPTO] Generating HMAC-SHA256 signature');
      console.log('[CRYPTO] Payload:', JSON.stringify(payload, null, 2));
    }
    
    const hmac = crypto.createHmac('sha256', secret);
    const payloadString = JSON.stringify(payload);
    hmac.update(payloadString);
    const signature = hmac.digest('hex');
    
    if (isDevelopment) {
      console.log('[CRYPTO] HMAC signature generated successfully');
      console.log('[CRYPTO] HMAC signature (first 32 chars):', signature.substring(0, 32) + '...');
      console.log('[CRYPTO] Payload length:', payloadString.length, 'bytes');
    }
    
    return signature;
  } catch (error) {
    console.error('[CRYPTO ERROR] Failed to generate HMAC:', error.message);
    if (isDevelopment) {
      console.error('[CRYPTO ERROR] Stack:', error.stack);
    }
    throw error;
  }
}

module.exports = {
  signData,
  getPublicKey,
  generateHMAC
};

