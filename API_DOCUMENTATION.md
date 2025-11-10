# INK NFS Backend API Documentation

## Base URL

- **Production**: `http://193.57.137.90:8000`
- **Local**: `http://localhost:8000`

## Authentication

All endpoints are publicly accessible. No authentication required.

## Rate Limiting

- **Limit**: 100 requests per hour per IP address
- **Response**: 429 Too Many Requests (when exceeded)

---

## API Endpoints

### 1. Health Check

Check if the server is running.

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### 2. Get Public Key (JWKS)

Get the Ed25519 public key in JWKS format for signature verification.

**Endpoint**: `GET /.well-known/jwks.json`

**Response**:
```json
{
  "keys": [
    {
      "kty": "OKP",
      "crv": "Ed25519",
      "kid": "key_001",
      "x": "base64url_encoded_public_key",
      "use": "sig"
    }
  ]
}
```

**Example**:
```bash
curl http://193.57.137.90:8000/.well-known/jwks.json
```

---

### 3. Enroll Package

Register a new package at shipment time. This endpoint generates a proof record and cryptographic signature.

**Endpoint**: `POST /enroll`

**Request Body**:
```json
{
  "order_id": "ORDER-12345",
  "nfc_uid": "04:1A:2B:3C:4D:5E:6F",
  "nfc_token": "token_test_abc123",
  "photo_urls": [
    "https://example.com/photo1.jpg",
    "https://example.com/photo2.jpg",
    "https://example.com/photo3.jpg",
    "https://example.com/photo4.jpg"
  ],
  "photo_hashes": [
    "hash1234567890abcdef",
    "hash2234567890abcdef",
    "hash3234567890abcdef",
    "hash4234567890abcdef"
  ],
  "shipping_address_gps": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "customer_phone_last4": "1234",
  "warehouse_gps": {
    "lat": 40.7580,
    "lng": -73.9855
  }
}
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `order_id` | string | Yes | Shopify order ID |
| `nfc_uid` | string | Yes | NFC tag UID (e.g., "04:1A:2B:3C:4D:5E:6F") |
| `nfc_token` | string | Yes | Unique NFC token |
| `photo_urls` | array | Yes | Array of exactly 4 photo URLs |
| `photo_hashes` | array | Yes | Array of exactly 4 SHA-256 hashes (one per photo) |
| `shipping_address_gps` | object | Yes | GPS coordinates of shipping address (`lat`, `lng`) |
| `customer_phone_last4` | string | No | Last 4 digits of customer phone number |
| `warehouse_gps` | object | No | GPS coordinates of warehouse (`lat`, `lng`) |

**Response** (200 OK):
```json
{
  "proof_id": "proof_abc123def456",
  "enrollment_status": "enrolled",
  "key_id": "key_001"
}
```

**Error Responses**:

- **400 Bad Request**: Missing required fields
  ```json
  {
    "error": "Missing required fields"
  }
  ```

- **400 Bad Request**: Invalid number of photos
  ```json
  {
    "error": "Exactly 4 photos required"
  }
  ```

- **400 Bad Request**: Duplicate token
  ```json
  {
    "error": "NFC token already enrolled"
  }
  ```

- **500 Internal Server Error**: Server error
  ```json
  {
    "error": "Internal server error"
  }
  ```

**Example**:
```bash
curl -X POST http://193.57.137.90:8000/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER-12345",
    "nfc_uid": "04:1A:2B:3C:4D:5E:6F",
    "nfc_token": "token_test_abc123",
    "photo_urls": [
      "https://example.com/photo1.jpg",
      "https://example.com/photo2.jpg",
      "https://example.com/photo3.jpg",
      "https://example.com/photo4.jpg"
    ],
    "photo_hashes": [
      "hash1234567890abcdef",
      "hash2234567890abcdef",
      "hash3234567890abcdef",
      "hash4234567890abcdef"
    ],
    "shipping_address_gps": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "customer_phone_last4": "1234",
    "warehouse_gps": {
      "lat": 40.7580,
      "lng": -73.9855
    }
  }'
```

**What Happens**:
1. Validates input data
2. Checks if NFC token already exists
3. Generates unique `proof_id`
4. Creates Ed25519 signature of enrollment data
5. Saves proof record to Firestore
6. Returns `proof_id` and enrollment status

**Signature Data** (signed with Ed25519):
```json
{
  "order_id": "ORDER-12345",
  "nfc_uid": "04:1A:2B:3C:4D:5E:6F",
  "photo_hashes": [
    "hash1234567890abcdef",
    "hash2234567890abcdef",
    "hash3234567890abcdef",
    "hash4234567890abcdef"
  ],
  "shipping_address_gps": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### 4. Verify Delivery

Verify package delivery when customer taps NFC tag. This endpoint calculates GPS distance, validates phone (if needed), and generates delivery signature.

**Endpoint**: `POST /verify`

**Request Body**:
```json
{
  "nfc_token": "token_test_abc123",
  "delivery_gps": {
    "lat": 40.7129,
    "lng": -74.0061
  },
  "device_info": "iPhone 14 Pro, iOS 17",
  "phone_last4": "1234"
}
```

**Request Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `nfc_token` | string | Yes | NFC token from enrollment |
| `delivery_gps` | object | Yes | GPS coordinates where customer tapped (`lat`, `lng`) |
| `device_info` | string | No | Device information (e.g., "iPhone 14 Pro, iOS 17") |
| `phone_last4` | string | Conditional | Last 4 digits of phone (required if distance > 100m) |

**Response** (200 OK):
```json
{
  "proof_id": "proof_abc123def456",
  "verification_status": "verified",
  "gps_verdict": "pass",
  "distance_meters": 11,
  "signature": "hex_encoded_signature",
  "verify_url": "https://in.ink/verify/proof_abc123def456"
}
```

**GPS Verdict Rules**:

| Distance | Verdict | Phone Verification |
|----------|---------|-------------------|
| ≤ 100m | `pass` | Not required |
| 100-300m | `near` | Required |
| > 300m | `flagged` | Required |

**Error Responses**:

- **400 Bad Request**: Missing required fields
  ```json
  {
    "error": "Missing required fields"
  }
  ```

- **400 Bad Request**: Phone verification required
  ```json
  {
    "error": "Phone verification required",
    "requires_phone": true
  }
  ```

- **400 Bad Request**: Already verified
  ```json
  {
    "error": "Already verified"
  }
  ```

- **403 Forbidden**: Phone verification failed
  ```json
  {
    "error": "Phone verification failed"
  }
  ```

- **404 Not Found**: Invalid token
  ```json
  {
    "error": "Invalid token"
  }
  ```

- **500 Internal Server Error**: Server error
  ```json
  {
    "error": "Internal server error"
  }
  ```

**Example**:
```bash
curl -X POST http://193.57.137.90:8000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "nfc_token": "token_test_abc123",
    "delivery_gps": {
      "lat": 40.7129,
      "lng": -74.0061
    },
    "device_info": "iPhone 14 Pro, iOS 17"
  }'
```

**What Happens**:
1. Finds proof record by `nfc_token`
2. Checks if already verified
3. Calculates GPS distance between delivery location and shipping address
4. Determines GPS verdict (`pass`, `near`, or `flagged`)
5. Validates phone last 4 digits if distance > 100m
6. Generates Ed25519 signature of delivery data
7. Updates proof record in Firestore
8. Sends webhook to Shopify (if configured)
9. Returns verification result

**Signature Data** (signed with Ed25519):
```json
{
  "proof_id": "proof_abc123def456",
  "order_id": "ORDER-12345",
  "delivery_gps": {
    "lat": 40.7129,
    "lng": -74.0061
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "gps_verdict": "pass"
}
```

---

### 5. Retrieve Proof

Retrieve complete proof record by proof_id.

**Endpoint**: `GET /retrieve/{proofId}`

**Path Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `proofId` | string | Yes | Proof ID from enrollment response |

**Response** (200 OK):
```json
{
  "proof_id": "proof_abc123def456",
  "order_id": "ORD123***45",
  "enrollment": {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "shipping_address_gps": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "warehouse_gps": {
      "lat": 40.7580,
      "lng": -73.9855
    },
    "photo_urls": [
      "https://example.com/photo1.jpg",
      "https://example.com/photo2.jpg",
      "https://example.com/photo3.jpg",
      "https://example.com/photo4.jpg"
    ],
    "photo_hashes": [
      "hash1234567890abcdef",
      "hash2234567890abcdef",
      "hash3234567890abcdef",
      "hash4234567890abcdef"
    ]
  },
  "delivery": {
    "timestamp": "2024-01-01T14:30:00.000Z",
    "delivery_gps": {
      "lat": 40.7129,
      "lng": -74.0061
    },
    "device_info": "iPhone 14 Pro, iOS 17",
    "gps_verdict": "pass",
    "phone_verified": false
  },
  "signature": "hex_encoded_signature",
  "public_key": "hex_encoded_public_key",
  "key_id": "key_001"
}
```

**Note**: `order_id` is masked for privacy (first 4 and last 3 characters shown).

**Error Responses**:

- **404 Not Found**: Proof not found
  ```json
  {
    "error": "Proof not found"
  }
  ```

- **500 Internal Server Error**: Server error
  ```json
  {
    "error": "Internal server error"
  }
  ```

**Example**:
```bash
curl http://193.57.137.90:8000/retrieve/proof_abc123def456
```

---

## Webhook Integration

When a package is verified, the backend sends a webhook to Shopify.

### Webhook Endpoint

**URL**: Configured via `SHOPIFY_WEBHOOK_URL` environment variable

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
X-INK-Signature: <HMAC-SHA256 signature>
```

**Payload**:
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

### HMAC Signature Verification

The webhook payload is signed with HMAC-SHA256. The signature is sent in the `X-INK-Signature` header.

**Verification Steps**:
1. Get the signature from `X-INK-Signature` header
2. Calculate HMAC-SHA256 of the request body using the shared secret
3. Compare the calculated signature with the received signature
4. If they match, the webhook is authentic

**Example (Node.js)**:
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const calculatedSignature = hmac.digest('hex');
  return calculatedSignature === signature;
}
```

---

## Error Codes

| Status Code | Description |
|------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid input |
| 403 | Forbidden - Phone verification failed |
| 404 | Not Found - Resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

---

## Data Types

### GPS Coordinates
```json
{
  "lat": 40.7128,
  "lng": -74.0060
}
```
- `lat`: Latitude (-90 to 90)
- `lng`: Longitude (-180 to 180)

### GPS Verdict
- `pass`: Distance ≤ 100m
- `near`: Distance 100-300m
- `flagged`: Distance > 300m

---

## Best Practices

1. **Store proof_id**: Save the `proof_id` from enrollment response for later retrieval
2. **Handle errors**: Always check for error responses and handle appropriately
3. **Verify signatures**: Verify cryptographic signatures for dispute resolution
4. **Rate limiting**: Respect rate limits (100 requests/hour per IP)
5. **GPS accuracy**: Ensure GPS coordinates are accurate for proper verification

---

## Testing

Use the provided `test-api.http` file or the test scripts to test all endpoints.

See `test-api.http` for complete test examples.

---

## Support

For issues or questions, contact the development team.

