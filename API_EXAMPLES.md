# API Examples and Integration Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [Complete Workflow Examples](#complete-workflow-examples)
3. [Error Handling](#error-handling)
4. [Integration Examples](#integration-examples)

---

## Quick Start

### 1. Health Check

```bash
curl http://193.57.137.90:8000/health
```

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Get Public Key

```bash
curl http://193.57.137.90:8000/.well-known/jwks.json
```

---

## Complete Workflow Examples

### Example 1: Complete Enrollment and Verification Flow

#### Step 1: Enroll Package

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

**Response**:
```json
{
  "proof_id": "proof_abc123def456",
  "enrollment_status": "enrolled",
  "key_id": "key_001"
}
```

#### Step 2: Verify Delivery (Distance ≤ 100m)

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

**Response**:
```json
{
  "proof_id": "proof_abc123def456",
  "verification_status": "verified",
  "gps_verdict": "pass",
  "distance_meters": 11,
  "signature": "abc123def456...",
  "verify_url": "https://in.ink/verify/proof_abc123def456"
}
```

#### Step 3: Retrieve Proof

```bash
curl http://193.57.137.90:8000/retrieve/proof_abc123def456
```

**Response**:
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
  "signature": "abc123def456...",
  "public_key": "def789abc123...",
  "key_id": "key_001"
}
```

---

### Example 2: Verification with Phone (Distance > 100m)

#### Step 1: Enroll Package

(Same as Example 1)

#### Step 2: Verify Delivery (Distance > 100m, Phone Required)

```bash
curl -X POST http://193.57.137.90:8000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "nfc_token": "token_test_abc123",
    "delivery_gps": {
      "lat": 40.8000,
      "lng": -74.1000
    },
    "device_info": "iPhone 14 Pro, iOS 17",
    "phone_last4": "1234"
  }'
```

**Response**:
```json
{
  "proof_id": "proof_abc123def456",
  "verification_status": "verified",
  "gps_verdict": "near",
  "distance_meters": 150,
  "signature": "abc123def456...",
  "verify_url": "https://in.ink/verify/proof_abc123def456"
}
```

---

## Error Handling

### Example: Missing Required Fields

**Request**:
```bash
curl -X POST http://193.57.137.90:8000/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER-12345"
  }'
```

**Response** (400 Bad Request):
```json
{
  "error": "Missing required fields"
}
```

### Example: Invalid Token

**Request**:
```bash
curl -X POST http://193.57.137.90:8000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "nfc_token": "invalid_token",
    "delivery_gps": {
      "lat": 40.7129,
      "lng": -74.0061
    }
  }'
```

**Response** (404 Not Found):
```json
{
  "error": "Invalid token"
}
```

### Example: Phone Verification Required

**Request**:
```bash
curl -X POST http://193.57.137.90:8000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "nfc_token": "token_test_abc123",
    "delivery_gps": {
      "lat": 40.8000,
      "lng": -74.1000
    },
    "device_info": "iPhone 14 Pro, iOS 17"
  }'
```

**Response** (400 Bad Request):
```json
{
  "error": "Phone verification required",
  "requires_phone": true
}
```

### Example: Phone Verification Failed

**Request**:
```bash
curl -X POST http://193.57.137.90:8000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "nfc_token": "token_test_abc123",
    "delivery_gps": {
      "lat": 40.8000,
      "lng": -74.1000
    },
    "device_info": "iPhone 14 Pro, iOS 17",
    "phone_last4": "9999"
  }'
```

**Response** (403 Forbidden):
```json
{
  "error": "Phone verification failed"
}
```

### Example: Already Verified

**Request**:
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

**Response** (400 Bad Request):
```json
{
  "error": "Already verified"
}
```

---

## Integration Examples

### Node.js Integration

```javascript
const fetch = require('node-fetch');

const API_BASE_URL = 'http://193.57.137.90:8000';

// Enroll package
async function enrollPackage(orderData) {
  try {
    const response = await fetch(`${API_BASE_URL}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Enrollment failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Enrollment error:', error);
    throw error;
  }
}

// Verify delivery
async function verifyDelivery(nfcToken, deliveryGps, deviceInfo, phoneLast4) {
  try {
    const response = await fetch(`${API_BASE_URL}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nfc_token: nfcToken,
        delivery_gps: deliveryGps,
        device_info: deviceInfo,
        phone_last4: phoneLast4
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Verification failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Verification error:', error);
    throw error;
  }
}

// Retrieve proof
async function retrieveProof(proofId) {
  try {
    const response = await fetch(`${API_BASE_URL}/retrieve/${proofId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Retrieval failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Retrieval error:', error);
    throw error;
  }
}

// Usage
(async () => {
  try {
    // 1. Enroll
    const enrollResult = await enrollPackage({
      order_id: "ORDER-12345",
      nfc_uid: "04:1A:2B:3C:4D:5E:6F",
      nfc_token: "token_test_abc123",
      photo_urls: [
        "https://example.com/photo1.jpg",
        "https://example.com/photo2.jpg",
        "https://example.com/photo3.jpg",
        "https://example.com/photo4.jpg"
      ],
      photo_hashes: [
        "hash1234567890abcdef",
        "hash2234567890abcdef",
        "hash3234567890abcdef",
        "hash4234567890abcdef"
      ],
      shipping_address_gps: {
        lat: 40.7128,
        lng: -74.0060
      },
      customer_phone_last4: "1234",
      warehouse_gps: {
        lat: 40.7580,
        lng: -73.9855
      }
    });

    console.log('Enrolled:', enrollResult);

    // 2. Verify
    const verifyResult = await verifyDelivery(
      "token_test_abc123",
      { lat: 40.7129, lng: -74.0061 },
      "iPhone 14 Pro, iOS 17"
    );

    console.log('Verified:', verifyResult);

    // 3. Retrieve
    const proof = await retrieveProof(enrollResult.proof_id);
    console.log('Proof:', proof);
  } catch (error) {
    console.error('Error:', error);
  }
})();
```

### Python Integration

```python
import requests
import json

API_BASE_URL = 'http://193.57.137.90:8000'

def enroll_package(order_data):
    """Enroll a new package"""
    try:
        response = requests.post(
            f'{API_BASE_URL}/enroll',
            json=order_data,
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Enrollment error: {e}')
        raise

def verify_delivery(nfc_token, delivery_gps, device_info=None, phone_last4=None):
    """Verify package delivery"""
    try:
        payload = {
            'nfc_token': nfc_token,
            'delivery_gps': delivery_gps,
            'device_info': device_info,
            'phone_last4': phone_last4
        }
        # Remove None values
        payload = {k: v for k, v in payload.items() if v is not None}
        
        response = requests.post(
            f'{API_BASE_URL}/verify',
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Verification error: {e}')
        raise

def retrieve_proof(proof_id):
    """Retrieve proof record"""
    try:
        response = requests.get(f'{API_BASE_URL}/retrieve/{proof_id}')
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Retrieval error: {e}')
        raise

# Usage
if __name__ == '__main__':
    try:
        # 1. Enroll
        enroll_result = enroll_package({
            'order_id': 'ORDER-12345',
            'nfc_uid': '04:1A:2B:3C:4D:5E:6F',
            'nfc_token': 'token_test_abc123',
            'photo_urls': [
                'https://example.com/photo1.jpg',
                'https://example.com/photo2.jpg',
                'https://example.com/photo3.jpg',
                'https://example.com/photo4.jpg'
            ],
            'photo_hashes': [
                'hash1234567890abcdef',
                'hash2234567890abcdef',
                'hash3234567890abcdef',
                'hash4234567890abcdef'
            ],
            'shipping_address_gps': {
                'lat': 40.7128,
                'lng': -74.0060
            },
            'customer_phone_last4': '1234',
            'warehouse_gps': {
                'lat': 40.7580,
                'lng': -73.9855
            }
        })
        
        print('Enrolled:', enroll_result)
        
        # 2. Verify
        verify_result = verify_delivery(
            'token_test_abc123',
            {'lat': 40.7129, 'lng': -74.0061},
            'iPhone 14 Pro, iOS 17'
        )
        
        print('Verified:', verify_result)
        
        # 3. Retrieve
        proof = retrieve_proof(enroll_result['proof_id'])
        print('Proof:', proof)
    except Exception as e:
        print(f'Error: {e}')
```

---

## Testing Scenarios

### Scenario 1: Happy Path (Auto Verify)

1. Enroll package with GPS coordinates
2. Verify delivery at same location (distance < 100m)
3. Should auto-verify without phone

### Scenario 2: Phone Verification Required

1. Enroll package with GPS coordinates
2. Verify delivery at different location (distance > 100m)
3. Should require phone verification
4. Provide correct phone last 4 digits
5. Should verify successfully

### Scenario 3: Phone Verification Failed

1. Enroll package with GPS coordinates
2. Verify delivery at different location (distance > 100m)
3. Provide incorrect phone last 4 digits
4. Should return 403 Forbidden

### Scenario 4: Duplicate Enrollment

1. Enroll package with NFC token
2. Try to enroll same NFC token again
3. Should return 400 Bad Request

### Scenario 5: Already Verified

1. Enroll package
2. Verify delivery (success)
3. Try to verify again
4. Should return 400 Bad Request

---

## Best Practices

1. **Store proof_id**: Always store the `proof_id` from enrollment response
2. **Handle errors**: Implement proper error handling for all API calls
3. **Retry logic**: Implement retry logic for transient errors
4. **Logging**: Log all API requests and responses
5. **Validation**: Validate input data before sending to API
6. **Rate limiting**: Respect rate limits (100 requests/hour per IP)

---

## Support

For integration issues or questions, contact the development team.

