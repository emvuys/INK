const crypto = require('crypto');

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Generate unique proof_id
function generateProofId() {
  try {
    const proofId = 'proof_' + crypto.randomBytes(12).toString('hex');
    
    if (isDevelopment) {
      console.log('[ID_GENERATOR] Generated proof_id:', proofId);
    }
    
    return proofId;
  } catch (error) {
    console.error('[ID_GENERATOR ERROR]', new Date().toISOString());
    console.error('[ID_GENERATOR ERROR] Message:', error.message);
    if (isDevelopment) {
      console.error('[ID_GENERATOR ERROR] Stack:', error.stack);
    }
    throw error;
  }
}

module.exports = { generateProofId };

