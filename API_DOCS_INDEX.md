# API Documentation Index

## Documentation Files

### 1. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
**Complete API reference documentation**
- All API endpoints
- Request/response schemas
- Error codes
- Data types
- Best practices

### 2. [openapi.yaml](./openapi.yaml)
**OpenAPI/Swagger specification**
- OpenAPI 3.0.3 specification
- Complete schema definitions
- Request/response examples
- Can be imported into Swagger UI, Postman, or other API tools

### 3. [SIGNATURE_VERIFICATION_GUIDE.md](./SIGNATURE_VERIFICATION_GUIDE.md)
**Ed25519 signature verification guide**
- How to verify cryptographic signatures
- Implementation examples (Node.js, Python, JavaScript)
- Complete verification code
- Troubleshooting guide

### 4. [WEBHOOK_VERIFICATION_GUIDE.md](./WEBHOOK_VERIFICATION_GUIDE.md)
**HMAC webhook verification guide**
- How to verify webhook signatures
- Implementation examples (Node.js, Python, PHP)
- Security best practices
- Testing guide

### 5. [API_EXAMPLES.md](./API_EXAMPLES.md)
**API usage examples and integration guide**
- Complete workflow examples
- Error handling examples
- Integration code (Node.js, Python)
- Testing scenarios

---

## Quick Links

### API Endpoints

- **Health Check**: `GET /health`
- **Get Public Key**: `GET /.well-known/jwks.json`
- **Enroll Package**: `POST /enroll`
- **Verify Delivery**: `POST /verify`
- **Retrieve Proof**: `GET /retrieve/{proofId}`

### Documentation Topics

- **API Reference**: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **OpenAPI Spec**: See [openapi.yaml](./openapi.yaml)
- **Signature Verification**: See [SIGNATURE_VERIFICATION_GUIDE.md](./SIGNATURE_VERIFICATION_GUIDE.md)
- **Webhook Verification**: See [WEBHOOK_VERIFICATION_GUIDE.md](./WEBHOOK_VERIFICATION_GUIDE.md)
- **Examples**: See [API_EXAMPLES.md](./API_EXAMPLES.md)

---

## Using the Documentation

### For API Consumers

1. Start with [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for API overview
2. Use [API_EXAMPLES.md](./API_EXAMPLES.md) for integration examples
3. Reference [openapi.yaml](./openapi.yaml) for complete schema definitions

### For Signature Verification

1. Read [SIGNATURE_VERIFICATION_GUIDE.md](./SIGNATURE_VERIFICATION_GUIDE.md)
2. Use provided code examples
3. Test with your implementation

### For Webhook Integration

1. Read [WEBHOOK_VERIFICATION_GUIDE.md](./WEBHOOK_VERIFICATION_GUIDE.md)
2. Implement HMAC verification
3. Test with webhook payloads

---

## OpenAPI/Swagger Usage

### View in Swagger UI

1. Install Swagger UI:
   ```bash
   npm install -g swagger-ui-serve
   ```

2. Serve the OpenAPI spec:
   ```bash
   swagger-ui-serve openapi.yaml
   ```

3. Open browser: `http://localhost:3000`

### Import into Postman

1. Open Postman
2. Click "Import"
3. Select "File" tab
4. Choose `openapi.yaml`
5. Click "Import"

### Import into Insomnia

1. Open Insomnia
2. Click "Create" > "Import/Export" > "Import Data"
3. Select "From File"
4. Choose `openapi.yaml`

---

## Testing

Use the provided test files:

- **test-api.http**: HTTP client test file (IntelliJ IDEA, VS Code REST Client)
- **test-server.ps1**: PowerShell test script

---

## Support

For documentation issues or questions, contact the development team.

