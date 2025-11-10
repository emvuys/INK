# Signature Verification Guide

## Overview

INK NFS Backend uses **Ed25519** cryptographic signatures to ensure the integrity and authenticity of proof records. This guide explains how to independently verify these signatures.

---

## Signature Types

### 1. Enrollment Signature

Signed when a package is enrolled (registered at shipment).

**Signed Data**:
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

### 2. Delivery Signature

Signed when a package is verified (customer taps NFC tag).

**Signed Data**:
```json
{
  "proof_id": "proof_abc123def456",
  "order_id": "ORDER-12345",
  "delivery_gps": {
    "lat": 40.7129,
    "lng": -74.0061
  },
  "timestamp": "2024-01-01T14:30:00.000Z",
  "gps_verdict": "pass"
}
```

---

## Getting the Public Key

### Method 1: JWKS Endpoint

```bash
curl http://193.57.137.90:8000/.well-known/jwks.json
```

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

### Method 2: Retrieve Endpoint

```bash
curl http://193.57.137.90:8000/retrieve/{proofId}
```

The response includes `public_key` in hex format.

---

## Verification Steps

### Step 1: Get Public Key

Retrieve the public key from the JWKS endpoint or proof record.

### Step 2: Get Signature and Data

Get the signature and the data that was signed from the proof record.

### Step 3: Verify Signature

Use Ed25519 to verify that the signature matches the data.

---

## Implementation Examples

### Node.js (using tweetnacl)

```javascript
const nacl = require('tweetnacl');

// 1. Get public key (hex format)
const publicKeyHex = "abc123..."; // From retrieve endpoint or JWKS
const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');

// 2. Get signature (hex format)
const signatureHex = "def456..."; // From proof record
const signatureBytes = Buffer.from(signatureHex, 'hex');

// 3. Get signed data
const signedData = {
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
};

// 4. Convert data to message bytes
const message = JSON.stringify(signedData);
const messageBytes = Buffer.from(message, 'utf8');

// 5. Verify signature
const isValid = nacl.sign.detached.verify(
  messageBytes,
  signatureBytes,
  publicKeyBytes
);

if (isValid) {
  console.log("✓ Signature is valid");
} else {
  console.log("✗ Signature is invalid");
}
```

### Python (using PyNaCl)

```python
import json
import nacl.signing
import nacl.encoding

# 1. Get public key (hex format)
public_key_hex = "abc123..."  # From retrieve endpoint or JWKS
public_key_bytes = bytes.fromhex(public_key_hex)
verify_key = nacl.signing.VerifyKey(public_key_bytes)

# 2. Get signature (hex format)
signature_hex = "def456..."  # From proof record
signature_bytes = bytes.fromhex(signature_hex)

# 3. Get signed data
signed_data = {
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

# 4. Convert data to message bytes
message = json.dumps(signed_data, separators=(',', ':'), sort_keys=False)
message_bytes = message.encode('utf-8')

# 5. Verify signature
try:
    verify_key.verify(message_bytes, signature_bytes)
    print("✓ Signature is valid")
except nacl.exceptions.BadSignatureError:
    print("✗ Signature is invalid")
```

### JavaScript (Browser)

```javascript
// Using Web Crypto API (if available) or tweetnacl-js
import nacl from 'tweetnacl';

// 1. Get public key (hex format)
const publicKeyHex = "abc123..."; // From retrieve endpoint or JWKS
const publicKeyBytes = Uint8Array.from(
  publicKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
);

// 2. Get signature (hex format)
const signatureHex = "def456..."; // From proof record
const signatureBytes = Uint8Array.from(
  signatureHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
);

// 3. Get signed data
const signedData = {
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
};

// 4. Convert data to message bytes
const message = JSON.stringify(signedData);
const messageBytes = new TextEncoder().encode(message);

// 5. Verify signature
const isValid = nacl.sign.detached.verify(
  messageBytes,
  signatureBytes,
  publicKeyBytes
);

if (isValid) {
  console.log("✓ Signature is valid");
} else {
  console.log("✗ Signature is invalid");
}
```

---

## Converting JWKS to Public Key

### From Base64URL to Hex

The JWKS endpoint returns the public key in Base64URL format. Convert it to hex:

**Node.js**:
```javascript
function base64urlToHex(base64url) {
  // Add padding if needed
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  
  const buffer = Buffer.from(base64, 'base64');
  return buffer.toString('hex');
}

// Usage
const base64url = "abc123..."; // From JWKS x field
const hex = base64urlToHex(base64url);
console.log(hex);
```

**Python**:
```python
import base64

def base64url_to_hex(base64url):
    # Add padding if needed
    base64 = base64url.replace('-', '+').replace('_', '/')
    while len(base64) % 4:
        base64 += '='
    
    decoded = base64.b64decode(base64)
    return decoded.hex()

# Usage
base64url = "abc123..."  # From JWKS x field
hex_key = base64url_to_hex(base64url)
print(hex_key)
```

---

## Complete Verification Example

### Node.js Complete Example

```javascript
const nacl = require('tweetnacl');
const fetch = require('node-fetch');

async function verifyProof(proofId) {
  try {
    // 1. Retrieve proof record
    const response = await fetch(`http://193.57.137.90:8000/retrieve/${proofId}`);
    const proof = await response.json();
    
    // 2. Get public key and signature
    const publicKeyHex = proof.public_key;
    const signatureHex = proof.signature;
    
    // 3. Reconstruct signed data based on proof state
    let signedData;
    
    if (proof.delivery) {
      // Delivery signature
      signedData = {
        proof_id: proof.proof_id,
        order_id: proof.order_id.replace('***', ''), // Unmask if needed
        delivery_gps: proof.delivery.delivery_gps,
        timestamp: proof.delivery.timestamp,
        gps_verdict: proof.delivery.gps_verdict
      };
    } else {
      // Enrollment signature (would need original data)
      console.log("Cannot verify enrollment signature without original data");
      return false;
    }
    
    // 4. Convert to bytes
    const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
    const signatureBytes = Buffer.from(signatureHex, 'hex');
    const message = JSON.stringify(signedData);
    const messageBytes = Buffer.from(message, 'utf8');
    
    // 5. Verify
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );
    
    return isValid;
  } catch (error) {
    console.error('Verification error:', error);
    return false;
  }
}

// Usage
verifyProof('proof_abc123def456').then(isValid => {
  if (isValid) {
    console.log('✓ Proof signature is valid');
  } else {
    console.log('✗ Proof signature is invalid');
  }
});
```

---

## Important Notes

### 1. JSON Serialization

**Critical**: The data must be serialized exactly as it was signed. This means:
- Same key order (if possible)
- Same whitespace
- Same formatting

The backend uses `JSON.stringify()` with default settings. Ensure your verification uses the same method.

### 2. Key Format

- **JWKS**: Base64URL encoded
- **Retrieve endpoint**: Hex encoded
- **Verification**: Requires hex or bytes format

### 3. Signature Format

All signatures are returned as **hex-encoded strings**. Convert to bytes before verification.

### 4. Timestamp Precision

Timestamps are in ISO 8601 format with milliseconds. Ensure exact match for verification.

---

## Verification Checklist

- [ ] Public key retrieved from JWKS or proof record
- [ ] Signature retrieved from proof record
- [ ] Signed data reconstructed exactly as signed
- [ ] Data serialized to JSON (matching original format)
- [ ] JSON converted to UTF-8 bytes
- [ ] Signature converted from hex to bytes
- [ ] Public key converted from hex to bytes
- [ ] Ed25519 verification performed
- [ ] Result validated

---

## Troubleshooting

### Signature Verification Fails

1. **Check data format**: Ensure JSON serialization matches exactly
2. **Check key format**: Ensure public key is in correct format
3. **Check signature format**: Ensure signature is hex-decoded correctly
4. **Check timestamp**: Ensure timestamp format matches exactly
5. **Check key ID**: Ensure using correct key (key_001)

### Common Issues

1. **Key mismatch**: Using wrong public key
2. **Data mismatch**: Signed data doesn't match retrieved data
3. **Format error**: Incorrect hex/base64 conversion
4. **Serialization error**: JSON format doesn't match

---

## Testing Verification

Use the test script to verify signatures:

```javascript
// test-signature-verification.js
const nacl = require('tweetnacl');
const fetch = require('node-fetch');

async function testVerification() {
  // 1. Enroll a package
  const enrollResponse = await fetch('http://localhost:8000/enroll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
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
    })
  });
  
  const enrollData = await enrollResponse.json();
  console.log('Enrolled:', enrollData);
  
  // 2. Verify delivery
  const verifyResponse = await fetch('http://localhost:8000/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nfc_token: "token_test_abc123",
      delivery_gps: {
        lat: 40.7129,
        lng: -74.0061
      },
      device_info: "iPhone 14 Pro, iOS 17"
    })
  });
  
  const verifyData = await verifyResponse.json();
  console.log('Verified:', verifyData);
  
  // 3. Retrieve proof
  const retrieveResponse = await fetch(`http://localhost:8000/retrieve/${enrollData.proof_id}`);
  const proof = await retrieveResponse.json();
  console.log('Proof:', proof);
  
  // 4. Verify signature
  const publicKeyBytes = Buffer.from(proof.public_key, 'hex');
  const signatureBytes = Buffer.from(proof.signature, 'hex');
  
  const deliveryData = {
    proof_id: proof.proof_id,
    order_id: proof.order_id.replace('***', 'ORDER-'), // Approximate
    delivery_gps: proof.delivery.delivery_gps,
    timestamp: proof.delivery.timestamp,
    gps_verdict: proof.delivery.gps_verdict
  };
  
  const message = JSON.stringify(deliveryData);
  const messageBytes = Buffer.from(message, 'utf8');
  
  const isValid = nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKeyBytes
  );
  
  console.log('Signature valid:', isValid);
}

testVerification().catch(console.error);
```

---

## Additional Resources

- [Ed25519 Algorithm](https://en.wikipedia.org/wiki/EdDSA)
- [JWKS Specification](https://tools.ietf.org/html/rfc7517)
- [tweetnacl Documentation](https://github.com/dchest/tweetnacl-js)
- [PyNaCl Documentation](https://pynacl.readthedocs.io/)

---

## Support

For signature verification issues, contact the development team with:
- Proof ID
- Public key used
- Signature value
- Signed data
- Error message

