# INK NFS API 快速参考

**Base URL**: `http://193.57.137.90:8000`

---

## 端点列表

### 1. POST /enroll
注册包裹

**请求**:
```json
{
  "order_id": "ORDER-12345",
  "nfc_uid": "04:1A:2B:3C:4D:5E:6F",
  "nfc_token": "token_abc123",
  "photo_urls": ["url1", "url2", "url3", "url4"],
  "photo_hashes": ["hash1", "hash2", "hash3", "hash4"],
  "shipping_address_gps": {"lat": 40.7128, "lng": -74.0060},
  "customer_phone_last4": "1234",
  "warehouse_gps": {"lat": 40.7580, "lng": -73.9855}
}
```

**响应**:
```json
{
  "proof_id": "proof_abc123",
  "enrollment_status": "enrolled",
  "key_id": "key_001"
}
```

---

### 2. POST /verify
验证配送

**请求**:
```json
{
  "nfc_token": "token_abc123",
  "delivery_gps": {"lat": 40.7129, "lng": -74.0061},
  "device_info": "iPhone 14 Pro",
  "phone_last4": "1234"
}
```

**响应**:
```json
{
  "proof_id": "proof_abc123",
  "verification_status": "verified",
  "gps_verdict": "pass",
  "distance_meters": 11,
  "signature": "hex_signature",
  "verify_url": "https://in.ink/verify/proof_abc123"
}
```

**GPS规则**:
- ≤100m: 自动验证
- 100-300m: 需要phone_last4
- \>300m: 需要phone_last4

---

### 3. GET /retrieve/{proofId}
查询证明

**响应**:
```json
{
  "proof_id": "proof_abc123",
  "order_id": "ORDE***345",
  "enrollment": {
    "timestamp": "2024-01-01T12:00:00Z",
    "shipping_address_gps": {"lat": 40.7128, "lng": -74.0060},
    "photo_urls": ["url1", "url2", "url3", "url4"]
  },
  "delivery": {
    "timestamp": "2024-01-01T14:30:00Z",
    "delivery_gps": {"lat": 40.7129, "lng": -74.0061},
    "gps_verdict": "pass"
  },
  "signature": "hex_signature",
  "public_key": "hex_public_key"
}
```

---

### 4. GET /.well-known/jwks.json
获取公钥

**响应**:
```json
{
  "keys": [{
    "kty": "OKP",
    "crv": "Ed25519",
    "kid": "key_001",
    "x": "base64url_public_key",
    "use": "sig"
  }]
}
```

---

### 5. GET /health
健康检查

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

## Webhook

验证成功后自动发送到 `SHOPIFY_WEBHOOK_URL`

**头部**: `X-INK-Signature: hmac_sha256_hex`

**载荷**:
```json
{
  "order_id": "ORDER-12345",
  "status": "verified",
  "delivery_gps": {"lat": 40.7129, "lng": -74.0061},
  "gps_verdict": "pass",
  "proof_ref": "proof_abc123",
  "timestamp": "2024-01-01T14:30:00Z",
  "verify_url": "https://in.ink/verify/proof_abc123"
}
```

**重试**: 失败后重试3次（2s, 4s, 8s间隔）

---

## 错误码

- `400`: 参数错误
- `403`: 手机验证失败
- `404`: 记录不存在
- `500`: 服务器错误

---

## 安全

- **Ed25519签名**: 所有数据签名
- **HMAC-SHA256**: Webhook签名
- **速率限制**: 100请求/小时/IP
- **HTTPS**: 生产环境必须

---

**文档**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)  
**测试**: [test-api.http](./test-api.http)

