# Webhook HMAC Verification Guide

## Overview

INK NFS Backend sends webhooks to Shopify when a package is verified. These webhooks are signed with **HMAC-SHA256** to ensure authenticity and integrity.

---

## Webhook Details

### Endpoint

**URL**: Configured via `SHOPIFY_WEBHOOK_URL` environment variable  
**Method**: `POST`  
**Content-Type**: `application/json`

### Headers

```
Content-Type: application/json
X-INK-Signature: <HMAC-SHA256 signature>
```

### Payload

```json
{
  "order_id": "ORDER-12345",
  "status": "verified",
  "delivery_gps": {
    "lat": 40.7129,
    "lng": -74.0061
  },
  "gps_verdict": "pass",
  "proof_ref": "proof_abc123def456",
  "timestamp": "2024-01-01T14:30:00.000Z",
  "verify_url": "https://in.ink/verify/proof_abc123def456"
}
```

---

## HMAC Signature Generation

The backend generates the signature as follows:

1. **Serialize payload**: Convert payload to JSON string
2. **Create HMAC**: Use HMAC-SHA256 with shared secret
3. **Encode signature**: Convert to hex string
4. **Send in header**: Include in `X-INK-Signature` header

### Backend Code (Reference)

```javascript
const crypto = require('crypto');

function generateHMAC(payload) {
  const secret = process.env.HMAC_SECRET; // Shared secret
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}
```

---

## Verification Steps

### Step 1: Get the Signature

Extract the signature from the `X-INK-Signature` header.

### Step 2: Get the Payload

Read the request body as a string (before parsing JSON).

### Step 3: Calculate HMAC

Calculate HMAC-SHA256 of the payload using the shared secret.

### Step 4: Compare

Compare the calculated signature with the received signature.

---

## Implementation Examples

### Node.js (Express)

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
const HMAC_SECRET = process.env.HMAC_SECRET; // Shared secret

// Middleware to verify webhook signature
function verifyWebhookSignature(req, res, next) {
  try {
    // 1. Get signature from header
    const signature = req.headers['x-ink-signature'];
    if (!signature) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    // 2. Get raw body (must be raw string, not parsed JSON)
    // Note: You may need to use body-parser with verify option
    const payload = JSON.stringify(req.body);

    // 3. Calculate HMAC
    const hmac = crypto.createHmac('sha256', HMAC_SECRET);
    hmac.update(payload);
    const calculatedSignature = hmac.digest('hex');

    // 4. Compare signatures (use constant-time comparison)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
  } catch (error) {
    console.error('Signature verification error:', error);
    return res.status(500).json({ error: 'Verification failed' });
  }
}

// Webhook endpoint
app.post('/ink/update', express.json(), verifyWebhookSignature, (req, res) => {
  const payload = req.body;
  
  console.log('Webhook received:', payload);
  
  // Process webhook
  // Update Shopify metafields, etc.
  
  res.status(200).json({ status: 'ok' });
});
```

### Node.js (Raw Body)

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
const HMAC_SECRET = process.env.HMAC_SECRET;

// Middleware to capture raw body
app.use('/ink/update', express.raw({ type: 'application/json' }));

// Webhook endpoint
app.post('/ink/update', (req, res) => {
  try {
    // 1. Get signature from header
    const signature = req.headers['x-ink-signature'];
    if (!signature) {
      return res.status(401).json({ error: 'Missing signature' });
    }

    // 2. Get raw body as string
    const rawBody = req.body.toString('utf8');

    // 3. Calculate HMAC
    const hmac = crypto.createHmac('sha256', HMAC_SECRET);
    hmac.update(rawBody);
    const calculatedSignature = hmac.digest('hex');

    // 4. Compare signatures
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 5. Parse JSON
    const payload = JSON.parse(rawBody);

    console.log('Webhook received:', payload);

    // Process webhook
    // Update Shopify metafields, etc.

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Python (Flask)

```python
from flask import Flask, request, jsonify
import hmac
import hashlib
import json

app = Flask(__name__)
HMAC_SECRET = os.environ.get('HMAC_SECRET')  # Shared secret

def verify_webhook_signature(request):
    # 1. Get signature from header
    signature = request.headers.get('X-INK-Signature')
    if not signature:
        return False, 'Missing signature'

    # 2. Get raw body
    raw_body = request.get_data(as_text=True)

    # 3. Calculate HMAC
    calculated_signature = hmac.new(
        HMAC_SECRET.encode('utf-8'),
        raw_body.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

    # 4. Compare signatures (use constant-time comparison)
    is_valid = hmac.compare_digest(signature, calculated_signature)

    return is_valid, None

@app.route('/ink/update', methods=['POST'])
def webhook():
    # Verify signature
    is_valid, error = verify_webhook_signature(request)
    if not is_valid:
        return jsonify({'error': error}), 401

    # Parse JSON
    payload = request.get_json()

    print('Webhook received:', payload)

    # Process webhook
    # Update Shopify metafields, etc.

    return jsonify({'status': 'ok'}), 200
```

### PHP

```php
<?php

function verifyWebhookSignature($payload, $signature, $secret) {
    // 1. Calculate HMAC
    $calculatedSignature = hash_hmac('sha256', $payload, $secret);
    
    // 2. Compare signatures (use constant-time comparison)
    return hash_equals($signature, $calculatedSignature);
}

// Webhook endpoint
$signature = $_SERVER['HTTP_X_INK_SIGNATURE'] ?? '';
$payload = file_get_contents('php://input');
$secret = getenv('HMAC_SECRET');

if (!verifyWebhookSignature($payload, $signature, $secret)) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid signature']);
    exit;
}

// Parse JSON
$data = json_decode($payload, true);

// Process webhook
// Update Shopify metafields, etc.

http_response_code(200);
echo json_encode(['status' => 'ok']);
```

---

## Important Security Considerations

### 1. Constant-Time Comparison

**Always use constant-time comparison** to prevent timing attacks:

- **Node.js**: `crypto.timingSafeEqual()`
- **Python**: `hmac.compare_digest()`
- **PHP**: `hash_equals()`

### 2. Raw Body

**Critical**: Use the **raw request body** (as string), not the parsed JSON object. The signature is calculated on the exact bytes sent.

### 3. Secret Management

- Store the shared secret securely (environment variable, secret manager)
- Never expose the secret in logs or error messages
- Rotate secrets periodically

### 4. Error Handling

- Return 401 Unauthorized for invalid signatures
- Log verification failures for monitoring
- Don't reveal why verification failed (security through obscurity)

---

## Testing

### Test Webhook Verification

```javascript
const crypto = require('crypto');

// Test data
const secret = 'your_shared_secret';
const payload = {
  order_id: "ORDER-12345",
  status: "verified",
  delivery_gps: {
    lat: 40.7129,
    lng: -74.0061
  },
  gps_verdict: "pass",
  proof_ref: "proof_abc123def456",
  timestamp: "2024-01-01T14:30:00.000Z",
  verify_url: "https://in.ink/verify/proof_abc123def456"
};

// Generate signature
const payloadString = JSON.stringify(payload);
const hmac = crypto.createHmac('sha256', secret);
hmac.update(payloadString);
const signature = hmac.digest('hex');

console.log('Payload:', payloadString);
console.log('Signature:', signature);

// Verify signature
const verifyHmac = crypto.createHmac('sha256', secret);
verifyHmac.update(payloadString);
const calculatedSignature = verifyHmac.digest('hex');

const isValid = crypto.timingSafeEqual(
  Buffer.from(signature),
  Buffer.from(calculatedSignature)
);

console.log('Signature valid:', isValid);
```

### Test with curl

```bash
# Generate signature
PAYLOAD='{"order_id":"ORDER-12345","status":"verified"}'
SECRET="your_shared_secret"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# Send webhook
curl -X POST http://localhost:8000/ink/update \
  -H "Content-Type: application/json" \
  -H "X-INK-Signature: $SIGNATURE" \
  -d "$PAYLOAD"
```

---

## Webhook Payload Schema

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `order_id` | string | Shopify order ID |
| `status` | string | Verification status (always "verified") |
| `delivery_gps` | object | GPS coordinates where customer tapped |
| `gps_verdict` | string | GPS verification verdict (pass/near/flagged) |
| `proof_ref` | string | Proof ID for reference |
| `timestamp` | string | ISO 8601 timestamp |
| `verify_url` | string | URL to view proof |

### Example Payload

```json
{
  "order_id": "ORDER-12345",
  "status": "verified",
  "delivery_gps": {
    "lat": 40.7129,
    "lng": -74.0061
  },
  "gps_verdict": "pass",
  "proof_ref": "proof_abc123def456",
  "timestamp": "2024-01-01T14:30:00.000Z",
  "verify_url": "https://in.ink/verify/proof_abc123def456"
}
```

---

## Error Handling

### Invalid Signature

If signature verification fails, return:

```json
{
  "error": "Invalid signature"
}
```

Status code: `401 Unauthorized`

### Missing Signature

If signature header is missing, return:

```json
{
  "error": "Missing signature"
}
```

Status code: `401 Unauthorized`

### Processing Errors

If webhook processing fails, return:

```json
{
  "error": "Processing failed"
}
```

Status code: `500 Internal Server Error`

---

## Retry Logic

The backend implements retry logic with exponential backoff:

1. **First attempt**: Immediate
2. **Second attempt**: After 1 second
3. **Third attempt**: After 2 seconds
4. **Fourth attempt**: After 4 seconds

If all attempts fail, the webhook is logged but not retried further.

---

## Best Practices

1. **Verify signature first**: Always verify signature before processing
2. **Idempotency**: Make webhook processing idempotent (handle duplicates)
3. **Logging**: Log all webhook requests and verifications
4. **Monitoring**: Monitor webhook success/failure rates
5. **Error handling**: Handle errors gracefully and return appropriate status codes

---

## Troubleshooting

### Signature Verification Fails

1. **Check secret**: Ensure using correct shared secret
2. **Check body format**: Ensure using raw body, not parsed JSON
3. **Check header name**: Ensure header is `X-INK-Signature` (case-sensitive)
4. **Check encoding**: Ensure body is UTF-8 encoded
5. **Check JSON format**: Ensure JSON is properly formatted

### Common Issues

1. **Body parsing**: Using parsed JSON instead of raw body
2. **Header case**: Wrong header case (`x-ink-signature` vs `X-INK-Signature`)
3. **Secret mismatch**: Using wrong shared secret
4. **Encoding issues**: Wrong character encoding

---

## Support

For webhook verification issues, contact the development team with:
- Webhook payload
- Signature header value
- Error message
- Verification code (if possible)

