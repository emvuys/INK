const express = require('express');
const admin = require('firebase-admin');
const { db } = require('../config/database');
const { signData } = require('../utils/crypto');
const { calculateDistance, getGpsVerdict } = require('../utils/gps');
const { sendWebhook } = require('../utils/webhook');

const router = express.Router();

// POST /verify - Verify delivery when customer taps NFC
router.post('/', async (req, res) => {
  try {
    const {
      nfc_token,
      delivery_gps,
      device_info,
      phone_last4
    } = req.body;

    if (!nfc_token || !delivery_gps) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find enrollment record by nfc_token
    const tokenQuery = await db.collection('proofs')
      .where('nfc_token', '==', nfc_token)
      .limit(1)
      .get();

    if (tokenQuery.empty) {
      return res.status(404).json({ error: 'Invalid token' });
    }

    const proofDoc = tokenQuery.docs[0];
    const proof = proofDoc.data();
    const proofId = proofDoc.id;

    // Check if already verified
    if (proof.delivery_timestamp) {
      return res.status(400).json({ error: 'Already verified' });
    }

    // Calculate GPS distance
    const shippingGps = proof.shipping_address_gps;
    const distance = calculateDistance(
      delivery_gps.lat,
      delivery_gps.lng,
      shippingGps.lat,
      shippingGps.lng
    );

    const verdict = getGpsVerdict(distance);

    // Check if phone verification needed
    let phoneVerified = false;
    let verificationStatus = 'verified';

    if (distance > 100) {
      // Phone verification required
      if (!phone_last4) {
        return res.status(400).json({ 
          error: 'Phone verification required',
          requires_phone: true
        });
      }

      if (phone_last4 !== proof.customer_phone_last4) {
        return res.status(403).json({ error: 'Phone verification failed' });
      }

      phoneVerified = true;
    }

    // Update signature with delivery data
    const deliverySignatureData = {
      proof_id: proofId,
      order_id: proof.order_id,
      delivery_gps,
      timestamp: new Date().toISOString(),
      gps_verdict: verdict
    };

    const newSignature = signData(deliverySignatureData);

    // Update Firestore document
    await db.collection('proofs').doc(proofId).update({
      delivery_timestamp: admin.firestore.FieldValue.serverTimestamp(),
      delivery_gps: delivery_gps,
      device_info: device_info || 'Unknown',
      gps_verdict: verdict,
      phone_verified: phoneVerified,
      signature: newSignature,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send webhook to Shopify
    const webhookPayload = {
      order_id: proof.order_id,
      status: verificationStatus,
      delivery_gps,
      gps_verdict: verdict,
      proof_ref: proofId,
      timestamp: new Date().toISOString(),
      verify_url: `https://in.ink/verify/${proofId}`
    };

    sendWebhook(webhookPayload).catch(err => {
      console.error('Webhook send failed:', err);
    });

    res.json({
      proof_id: proofId,
      verification_status: verificationStatus,
      gps_verdict: verdict,
      distance_meters: Math.round(distance),
      signature: newSignature,
      verify_url: `https://in.ink/verify/${proofId}`
    });

  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
