const express = require('express');
const { getPublicKey } = require('../utils/crypto');

const router = express.Router();

// GET /.well-known/jwks.json - Expose Ed25519 public key in JWKS format
router.get('/jwks.json', (req, res) => {
  try {
    const publicKeyHex = getPublicKey();
    const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
    
    // Convert to base64url format
    const base64url = publicKeyBytes
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    res.json({
      keys: [
        {
          kty: 'OKP',
          crv: 'Ed25519',
          kid: 'key_001',
          x: base64url,
          use: 'sig'
        }
      ]
    });
  } catch (error) {
    console.error('JWKS error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

