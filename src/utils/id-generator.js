const crypto = require('crypto');

// Generate unique proof_id
function generateProofId() {
  return 'proof_' + crypto.randomBytes(12).toString('hex');
}

module.exports = { generateProofId };

