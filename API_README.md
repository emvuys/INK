# INK NFS Backend API Documentation

Complete API documentation for the INK NFS (Near Field Signature) Backend system.

## Documentation Files

### 📚 Main Documentation

1. **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**
   - Complete API reference
   - All endpoints with request/response examples
   - Error codes and handling
   - Data types and schemas

2. **[openapi.yaml](./openapi.yaml)**
   - OpenAPI 3.0.3 specification
   - Can be imported into Swagger UI, Postman, Insomnia
   - Complete schema definitions
   - Interactive API documentation

3. **[API_EXAMPLES.md](./API_EXAMPLES.md)**
   - Complete workflow examples
   - Integration code (Node.js, Python)
   - Error handling examples
   - Testing scenarios

### 🔐 Security Documentation

4. **[SIGNATURE_VERIFICATION_GUIDE.md](./SIGNATURE_VERIFICATION_GUIDE.md)**
   - Ed25519 signature verification
   - Implementation examples (Node.js, Python, JavaScript)
   - Complete verification code
   - Troubleshooting guide

5. **[WEBHOOK_VERIFICATION_GUIDE.md](./WEBHOOK_VERIFICATION_GUIDE.md)**
   - HMAC-SHA256 webhook verification
   - Implementation examples (Node.js, Python, PHP)
   - Security best practices
   - Testing guide

### 📑 Index

6. **[API_DOCS_INDEX.md](./API_DOCS_INDEX.md)**
   - Documentation index
   - Quick links
   - Usage guide

---

## Quick Start

### 1. View API Documentation

Read [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

### 2. Use OpenAPI Specification

**View in Swagger UI**:
```bash
# Install Swagger UI
npm install -g swagger-ui-serve

# Serve the OpenAPI spec
swagger-ui-serve openapi.yaml
```

**Import into Postman**:
1. Open Postman
2. Click "Import" > "File"
3. Select `openapi.yaml`
4. Click "Import"

### 3. Test APIs

Use the provided test files:
- `test-api.http` - HTTP client test file
- `test-server.ps1` - PowerShell test script

---

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/.well-known/jwks.json` | GET | Get public key (JWKS) |
| `/enroll` | POST | Enroll package |
| `/verify` | POST | Verify delivery |
| `/retrieve/{proofId}` | GET | Retrieve proof |

---

## Key Features

### 🔒 Cryptographic Signatures
- **Ed25519** signatures for proof records
- **HMAC-SHA256** for webhook authentication
- Public key exposed via JWKS endpoint

### 📍 GPS Verification
- Haversine formula for distance calculation
- Automatic verification (distance ≤ 100m)
- Phone verification (distance > 100m)

### 📸 Photo Verification
- SHA-256 hashing for photo integrity
- 4 photos required per package
- Tamper-proof verification

---

## Integration Steps

### 1. Get Public Key
```bash
curl http://193.57.137.90:8000/.well-known/jwks.json
```

### 2. Enroll Package
```bash
curl -X POST http://193.57.137.90:8000/enroll \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORDER-12345",
    "nfc_uid": "04:1A:2B:3C:4D:5E:6F",
    "nfc_token": "token_test_abc123",
    "photo_urls": [...],
    "photo_hashes": [...],
    "shipping_address_gps": {...}
  }'
```

### 3. Verify Delivery
```bash
curl -X POST http://193.57.137.90:8000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "nfc_token": "token_test_abc123",
    "delivery_gps": {...}
  }'
```

### 4. Retrieve Proof
```bash
curl http://193.57.137.90:8000/retrieve/{proofId}
```

---

## Signature Verification

See [SIGNATURE_VERIFICATION_GUIDE.md](./SIGNATURE_VERIFICATION_GUIDE.md) for:
- How to verify Ed25519 signatures
- Implementation examples
- Troubleshooting guide

---

## Webhook Integration

See [WEBHOOK_VERIFICATION_GUIDE.md](./WEBHOOK_VERIFICATION_GUIDE.md) for:
- How to verify HMAC-SHA256 signatures
- Implementation examples
- Security best practices

---

## Examples

See [API_EXAMPLES.md](./API_EXAMPLES.md) for:
- Complete workflow examples
- Integration code
- Error handling
- Testing scenarios

---

## Support

For API questions or issues, contact the development team.

