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

    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    if (isDevelopment) {
      console.log('[VERIFY] Found proof record');
      console.log('[VERIFY] Proof ID:', proofId);
      console.log('[VERIFY] Order ID:', proof.order_id);
    }

    // Calculate GPS distance
    const shippingGps = proof.shipping_address_gps;
    
    if (isDevelopment) {
      console.log('[VERIFY] Calculating GPS distance');
      console.log('[VERIFY] Delivery GPS:', JSON.stringify(delivery_gps, null, 2));
      console.log('[VERIFY] Shipping GPS:', JSON.stringify(shippingGps, null, 2));
    }
    
    const distance = calculateDistance(
      delivery_gps.lat,
      delivery_gps.lng,
      shippingGps.lat,
      shippingGps.lng
    );

    const verdict = getGpsVerdict(distance);
    
    if (isDevelopment) {
      console.log('[VERIFY] Distance calculated:', Math.round(distance), 'meters');
      console.log('[VERIFY] GPS verdict:', verdict);
    }

    // Check if phone verification needed
    let phoneVerified = false;
    let verificationStatus = 'verified';

    if (distance > 100) {
      // Phone verification required
      if (isDevelopment) {
        console.log('[VERIFY] Distance > 100m, phone verification required');
      }
      
      if (!phone_last4) {
        if (isDevelopment) {
          console.log('[VERIFY] Phone verification required but not provided');
        }
        return res.status(400).json({ 
          error: 'Phone verification required',
          requires_phone: true
        });
      }

      if (isDevelopment) {
        console.log('[VERIFY] Verifying phone last 4 digits');
        console.log('[VERIFY] Provided:', phone_last4);
        console.log('[VERIFY] Expected:', proof.customer_phone_last4);
      }

      if (phone_last4 !== proof.customer_phone_last4) {
        if (isDevelopment) {
          console.log('[VERIFY] Phone verification failed');
        }
        return res.status(403).json({ error: 'Phone verification failed' });
      }

      phoneVerified = true;
      if (isDevelopment) {
        console.log('[VERIFY] Phone verification successful');
      }
    } else {
      if (isDevelopment) {
        console.log('[VERIFY] Distance <= 100m, phone verification not required');
      }
    }

    // Update signature with delivery data
    const deliverySignatureData = {
      proof_id: proofId,
      order_id: proof.order_id,
      delivery_gps,
      timestamp: new Date().toISOString(),
      gps_verdict: verdict
    };

    if (isDevelopment) {
      console.log('[VERIFY] Preparing delivery signature data');
      console.log('[VERIFY] Signature data:', JSON.stringify(deliverySignatureData, null, 2));
    }

    const newSignature = signData(deliverySignatureData);
    
    if (isDevelopment) {
      console.log('[VERIFY] Delivery signature generated');
    }

    // Update Firestore document
    if (isDevelopment) {
      console.log('[VERIFY] Updating Firestore document...');
    }
    
    await db.collection('proofs').doc(proofId).update({
      delivery_timestamp: admin.firestore.FieldValue.serverTimestamp(),
      delivery_gps: delivery_gps,
      device_info: device_info || 'Unknown',
      gps_verdict: verdict,
      phone_verified: phoneVerified,
      signature: newSignature,
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    if (isDevelopment) {
      console.log('[VERIFY] Firestore document updated successfully');
    }

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

    if (isDevelopment) {
      console.log('[VERIFY] Sending webhook to Shopify');
      console.log('[VERIFY] Webhook payload:', JSON.stringify(webhookPayload, null, 2));
    }

    // Send webhook asynchronously (don't wait for it to complete)
    sendWebhook(webhookPayload).then(result => {
      if (result.skipped) {
        if (isDevelopment) {
          console.log('[VERIFY] Webhook skipped (SHOPIFY_WEBHOOK_URL not configured)');
        }
      } else if (result.success) {
        console.log(`[VERIFY] Webhook sent successfully (attempt ${result.attempt}/${3})`);
      } else {
        console.error('[VERIFY] Webhook failed after all retries:', result.error);
      }
    }).catch(err => {
      console.error('[VERIFY ERROR] Unexpected webhook error:', err.message);
      if (isDevelopment) {
        console.error('[VERIFY ERROR] Webhook error stack:', err.stack);
      }
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
    const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    console.error('[VERIFY ERROR]', new Date().toISOString());
    console.error('[VERIFY ERROR] Message:', error.message);
    if (isDevelopment) {
      console.error('[VERIFY ERROR] Stack:', error.stack);
      if (error.code) {
        console.error('[VERIFY ERROR] Error code:', error.code);
      }
      console.error('[VERIFY ERROR] Request body:', JSON.stringify(req.body, null, 2));
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
