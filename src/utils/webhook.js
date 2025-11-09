const { generateHMAC } = require('./crypto');

// Send webhook to Shopify endpoint
async function sendWebhook(payload) {
  const url = process.env.SHOPIFY_WEBHOOK_URL;
  if (!url) {
    console.log('SHOPIFY_WEBHOOK_URL not set, skipping webhook');
    return;
  }

  const signature = generateHMAC(payload);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-INK-Signature': signature
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    console.log('✓ Webhook sent successfully');
  } catch (error) {
    console.error('✗ Webhook failed:', error.message);
    // TODO: Implement retry logic with exponential backoff
  }
}

module.exports = { sendWebhook };

