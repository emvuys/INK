const { generateHMAC } = require('./crypto');

const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Send single webhook request (internal function)
async function sendWebhookRequest(url, signature, payload, attempt = 1) {
  if (isDevelopment) {
    console.log(`[WEBHOOK] Attempt ${attempt}: Sending webhook to ${url}`);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-INK-Signature': signature
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook failed with status ${response.status}: ${response.statusText}`);
  }

  return response;
}

// Send webhook to Shopify endpoint with retry logic
async function sendWebhook(payload) {
  const url = process.env.SHOPIFY_WEBHOOK_URL;
  
  // Skip if webhook URL is not configured
  if (!url) {
    console.log('[WEBHOOK] SHOPIFY_WEBHOOK_URL not set, skipping webhook');
    return { success: true, skipped: true };
  }

  const maxRetries = 3;
  let lastError = null;

  try {
    if (isDevelopment) {
      console.log('[WEBHOOK] Generating HMAC signature for webhook');
    }

    const signature = generateHMAC(payload);
    
    if (isDevelopment) {
      console.log('[WEBHOOK] HMAC signature generated');
      console.log('[WEBHOOK] Webhook URL:', url);
      console.log('[WEBHOOK] Request headers:', {
        'Content-Type': 'application/json',
        'X-INK-Signature': signature.substring(0, 32) + '...'
      });
    }

    // Retry loop with exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await sendWebhookRequest(url, signature, payload, attempt);
        
        // Success
        if (isDevelopment) {
          console.log(`[WEBHOOK] Webhook sent successfully on attempt ${attempt}`);
          console.log('[WEBHOOK] Response status:', response.status);
        } else {
          console.log(`[WEBHOOK] Webhook sent successfully (attempt ${attempt}/${maxRetries})`);
        }
        
        return { success: true, attempt, status: response.status };
        
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          // Calculate exponential backoff delay: 2^attempt seconds (2s, 4s, 8s)
          const delaySeconds = Math.pow(2, attempt);
          const delayMs = delaySeconds * 1000;
          
          console.warn(`[WEBHOOK] Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
          console.warn(`[WEBHOOK] Retrying in ${delaySeconds} seconds...`);
          
          if (isDevelopment) {
            console.warn('[WEBHOOK] Error details:', {
              message: error.message,
              code: error.code,
              attempt: attempt,
              nextRetryIn: `${delaySeconds}s`
            });
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, delayMs));
        } else {
          // Final attempt failed
          console.error(`[WEBHOOK] All ${maxRetries} attempts failed`);
        }
      }
    }
    
    // All retries exhausted
    throw lastError;
    
  } catch (error) {
    console.error('[WEBHOOK ERROR]', new Date().toISOString());
    console.error('[WEBHOOK ERROR] Message:', error.message);
    console.error('[WEBHOOK ERROR] Failed after', maxRetries, 'attempts');
    
    if (isDevelopment) {
      console.error('[WEBHOOK ERROR] Stack:', error.stack);
      if (error.code) {
        console.error('[WEBHOOK ERROR] Error code:', error.code);
      }
      console.error('[WEBHOOK ERROR] Payload:', JSON.stringify(payload, null, 2));
    }
    
    // Return error info instead of throwing (to avoid breaking the verify endpoint)
    return { 
      success: false, 
      error: error.message,
      attempts: maxRetries 
    };
  }
}

module.exports = { sendWebhook };

