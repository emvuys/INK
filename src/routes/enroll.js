const express = require('express');
const admin = require('firebase-admin');
const { db } = require('../config/database');
const { signData } = require('../utils/crypto');
const { generateProofId } = require('../utils/id-generator');

const router = express.Router();

// POST /enroll - Register package at shipment
router.post('/', async (req, res) => {
  try {
    const {
      order_id,
      nfc_uid,
      nfc_token,
      photo_urls,
      photo_hashes,
      shipping_address_gps,
      customer_phone_last4,
      warehouse_gps
    } = req.body;

    // Basic validation
    if (!order_id || !nfc_uid || !nfc_token || !photo_urls || !photo_hashes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!Array.isArray(photo_urls) || photo_urls.length !== 4) {
      return res.status(400).json({ error: 'Exactly 4 photos required' });
    }

    // Check if token already exists
    const tokenQuery = await db.collection('proofs')
      .where('nfc_token', '==', nfc_token)
      .limit(1)
      .get();

    if (!tokenQuery.empty) {
      return res.status(400).json({ error: 'NFC token already enrolled' });
    }

    const proofId = generateProofId();
    const keyId = 'key_001';

    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    if (isDevelopment) {
      console.log('[ENROLL] Generated proof_id:', proofId);
      console.log('[ENROLL] Order ID:', order_id);
      console.log('[ENROLL] NFC UID:', nfc_uid);
      console.log('[ENROLL] NFC Token (first 8 chars):', nfc_token.substring(0, 8) + '***');
    }

    // Prepare data for signature
    const signatureData = {
      order_id,
      nfc_uid,
      photo_hashes,
      shipping_address_gps,
      timestamp: new Date().toISOString()
    };

    if (isDevelopment) {
      console.log('[ENROLL] Preparing signature data');
      console.log('[ENROLL] Signature data:', JSON.stringify(signatureData, null, 2));
    }

    const signature = signData(signatureData);
    
    if (isDevelopment) {
      console.log('[ENROLL] Signature generated and stored');
    }

    // Prepare document data
    const proofData = {
      proof_id: proofId,
      order_id: order_id,
      nfc_uid: nfc_uid,
      nfc_token: nfc_token,
      enrollment_timestamp: admin.firestore.FieldValue.serverTimestamp(),
      shipping_address_gps: shipping_address_gps,
      warehouse_gps: warehouse_gps,
      photo_urls: photo_urls,
      photo_hashes: photo_hashes,
      customer_phone_last4: customer_phone_last4,
      delivery_timestamp: null,
      delivery_gps: null,
      device_info: null,
      gps_verdict: null,
      phone_verified: false,
      signature: signature,
      key_id: keyId,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    if (isDevelopment) {
      console.log('[ENROLL] Saving to Firestore...');
    }
    
    await db.collection('proofs').doc(proofId).set(proofData);
    
    if (isDevelopment) {
      console.log('[ENROLL] Successfully saved to Firestore');
      console.log('[ENROLL] Proof ID:', proofId);
    }

    res.json({
      proof_id: proofId,
      enrollment_status: 'enrolled',
      key_id: keyId
    });

  } catch (error) {
    console.error('[ENROLL ERROR]', new Date().toISOString());
    console.error('[ENROLL ERROR] Message:', error.message);
    if (isDevelopment) {
      console.error('[ENROLL ERROR] Stack:', error.stack);
      if (error.code) {
        console.error('[ENROLL ERROR] Error code:', error.code);
      }
      console.error('[ENROLL ERROR] Request body:', JSON.stringify(req.body, null, 2));
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
