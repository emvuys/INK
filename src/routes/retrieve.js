const express = require('express');
const { db } = require('../config/database');
const { getPublicKey } = require('../utils/crypto');

const router = express.Router();

// GET /retrieve/:proofId - Retrieve complete proof record
router.get('/:proofId', async (req, res) => {
  try {
    const { proofId } = req.params;

    const proofDoc = await db.collection('proofs').doc(proofId).get();

    if (!proofDoc.exists) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    const proof = proofDoc.data();

    // Convert Firestore Timestamps to ISO strings
    const enrollmentTimestamp = proof.enrollment_timestamp?.toDate?.()?.toISOString() || proof.enrollment_timestamp;
    const deliveryTimestamp = proof.delivery_timestamp?.toDate?.()?.toISOString() || proof.delivery_timestamp;

    // Mask order_id for privacy
    const maskedOrderId = proof.order_id.slice(0, 4) + '***' + proof.order_id.slice(-3);

    res.json({
      proof_id: proofId,
      order_id: maskedOrderId,
      enrollment: {
        timestamp: enrollmentTimestamp,
        shipping_address_gps: proof.shipping_address_gps,
        warehouse_gps: proof.warehouse_gps,
        photo_urls: proof.photo_urls,
        photo_hashes: proof.photo_hashes
      },
      delivery: deliveryTimestamp ? {
        timestamp: deliveryTimestamp,
        delivery_gps: proof.delivery_gps,
        device_info: proof.device_info,
        gps_verdict: proof.gps_verdict,
        phone_verified: proof.phone_verified
      } : null,
      signature: proof.signature,
      public_key: getPublicKey(),
      key_id: proof.key_id
    });

  } catch (error) {
    console.error('Retrieve error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
