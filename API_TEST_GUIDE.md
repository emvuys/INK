# API 测试指南

## 服务器状态

服务器运行在: `http://localhost:8000`

## 测试方法

### 方法1: 使用 PowerShell 脚本 (Windows)

```powershell
.\test-api.ps1
```

### 方法2: 使用 curl 命令

#### 1. 健康检查
```bash
curl http://localhost:8000/health
```

#### 2. 获取公钥
```bash
curl http://localhost:8000/.well-known/jwks.json
```

#### 3. 注册包裹 (Enroll)
```bash
curl -X POST http://localhost:8000/enroll \
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

**响应示例:**
```json
{
  "proof_id": "proof_abc123...",
  "enrollment_status": "enrolled",
  "key_id": "key_001"
}
```

#### 4. 验证递送 (Verify)
```bash
curl -X POST http://localhost:8000/verify \
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

**响应示例:**
```json
{
  "proof_id": "proof_abc123...",
  "verification_status": "verified",
  "gps_verdict": "pass",
  "distance_meters": 123,
  "signature": "...",
  "verify_url": "https://in.ink/verify/proof_abc123..."
}
```

#### 5. 查询证明 (Retrieve)
```bash
curl http://localhost:8000/retrieve/proof_abc123...
```

### 方法3: 使用 VS Code REST Client

1. 安装 VS Code REST Client 扩展
2. 打开 `test-api.http` 文件
3. 点击每个请求上方的 "Send Request" 按钮

### 方法4: 使用 Postman

1. 导入 `test-api.http` 文件到 Postman
2. 或者手动创建请求:
   - `GET http://localhost:8000/health`
   - `POST http://localhost:8000/enroll`
   - `POST http://localhost:8000/verify`
   - `GET http://localhost:8000/retrieve/:proofId`

## 测试场景

### 场景1: 正常流程 (GPS距离 < 100m)
1. 注册包裹 → 获取 `proof_id`
2. 验证递送 (GPS距离很近) → 自动通过，不需要手机验证
3. 查询证明 → 查看完整记录

### 场景2: 需要手机验证 (GPS距离 > 100m)
1. 注册包裹
2. 验证递送 (GPS距离较远) → 需要提供 `phone_last4`
3. 如果手机号正确 → 验证通过

### 场景3: 错误处理
- 无效的 token → 404错误
- 缺少必需字段 → 400错误
- 重复注册 → 400错误
- 已经验证过 → 400错误

## 预期响应

### 成功响应
- `200 OK` - 请求成功
- `201 Created` - 资源创建成功

### 错误响应
- `400 Bad Request` - 请求参数错误
- `404 Not Found` - 资源不存在
- `403 Forbidden` - 权限不足
- `500 Internal Server Error` - 服务器错误

## 下一步

1. ✅ 测试所有API端点
2. ✅ 验证数据是否正确存入Firestore
3. ✅ 测试错误处理
4. ✅ 与Taimoor的Shopify应用集成

