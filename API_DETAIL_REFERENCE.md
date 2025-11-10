# INK NFS 数据库表设计

## proofs 集合字段

| 字段名                | 类型      | 说明                                                                |
|---------------------- |-----------|------------------------------------------------------------------|
| proof_id              | string    | 证明ID，主键，系统生成                                            |
| order_id              | string    | Shopify订单ID                                                     |
| nfc_uid               | string    | NFC标签的物理硬件UID                                              |
| nfc_token             | string    | NFC标签生成的唯一token                                            |
| enrollment_timestamp  | timestamp | 注册时间（Firestore serverTimestamp）                             |
| shipping_address_gps  | object    | 配送地址GPS坐标 {lat, lng}                                       |
| warehouse_gps         | object    | 仓库GPS坐标 {lat, lng, 可选}                                     |
| photo_urls            | string[]  | 四张包裹照片的URL                                                 |
| photo_hashes          | string[]  | 四张包裹照片的SHA-256哈希值                                       |
| customer_phone_last4  | string    | 客户手机号后4位（脱敏存储）                                       |
| delivery_timestamp    | timestamp | 实际交付时间（/verify写入）                                       |
| delivery_gps          | object    | 实际交付时的GPS坐标 {lat, lng} （/verify写入）                   |
| device_info           | string    | 设备信息（如手机型号，/verify写入）                               |
| gps_verdict           | string    | GPS验证结果（pass/near/flagged，/verify写入）                    |
| phone_verified        | bool      | 手机号验证是否通过（/verify写，默认false）                        |
| signature             | string    | Ed25519签名（注册或验证后签名）                                   |
| key_id                | string    | 公钥ID，默认为key_001                                             |
| created_at            | timestamp | 创建时间（Firestore serverTimestamp）                             |
| updated_at            | timestamp | 更新时间（Firestore serverTimestamp，每次变更都会刷新）           |

> 所有GPS类型字段结构为 `{ lat: number, lng: number }`。
> 所有时间戳为ISO8601字符串或Firestore timestamp类型。

---

# INK NFS RESTful API 详细文档

**基础URL**：`http://193.57.137.90:8000`

---

## 公共说明
- 请求和响应均为 `application/json`。
- "必填" 表示字段必须提供，"可选" 表示可为空。

---

## 1. POST `/enroll`  包裹注册

- **功能**：商户注册新包裹，生成proof_id、签名

### 签名说明（enroll接口签名数据结构）
- 签名算法：Ed25519
- 签名密钥：私钥仅服务端持有，验证用公钥可通过 `/jwks.json` 获取
- **签名字段顺序及结构如下（字段顺序必须严格一致）：**
```json
{
  "order_id": "...",
  "nfc_uid": "...",
  "photo_hashes": ["...","...","...","..."],
  "shipping_address_gps": { "lat": 00.0, "lng": 00.0 },
  "timestamp": "2024-12-01T12:34:56.000Z"
}
```

#### 签名完整流程（开发者/集成方须知）
1. **字段按照上面顺序拼装，构造对象**。
2. **用 `JSON.stringify` 转为字符串**（保证key顺序、数值、时区格式完全一致）。
3. **服务器用Ed25519私钥生成签名**，返回 `signature`。
4. **客户/第三方验签**：
   - 获取返回的 `public_key` 和 `signature` 字段
   - 用相同规则（同字段顺序和JSON格式）构造待验证消息体json字符串
   - 转为utf8字节流，使用 `tweetnacl.sign.detached.verify()` 或等价函数验签

##### Node.js示例
```js
const nacl = require('tweetnacl');

// 1. 拼装签名数据
const dataToSign = {
  order_id: "ORDER-12345",
  nfc_uid: "04:1A:2B:3C:4D:5E:6F",
  photo_hashes: ["a1b2...","f6g7...","k1l2...","p6q7..."],
  shipping_address_gps: { lat: 40.7128, lng: -74.0060 },
  timestamp: "2024-12-01T12:34:56.000Z"
};
const message = JSON.stringify(dataToSign);
const dataBytes = Buffer.from(message, 'utf8');

// 2. 服务端签名
const secretKey = Buffer.from(PRIVATE_KEY_HEX, 'hex');
const signature = nacl.sign.detached(dataBytes, secretKey);
const signatureHex = Buffer.from(signature).toString('hex');

// 3. 验证端验签
const publicKey = Buffer.from(PUBLIC_KEY_HEX, 'hex');
const sigBytes = Buffer.from(signatureHex, 'hex');
const isValid = nacl.sign.detached.verify(dataBytes, sigBytes, publicKey);
console.log(isValid); // true为验证通过
```
**注意事项：**
- 保证字段顺序、数组顺序、数字/小数精度、时间格式都和服务端完全一致，否则验签会失败。
- 推荐调试时先打印message字符串，确保api返回里签名的原文等于你本地验签用的json。

---

### 请求参数表
| 字段名                | 类型     | 必填 | 说明                         | 示例                           |
|----------------------|----------|------|------------------------------|--------------------------------|
| order_id             | string   | 是   | 订单ID                      | "ORDER-12345"                |
| nfc_uid              | string   | 是   | NFC标签硬件ID               | "04:1A:2B:3C:4D:5E:6F"       |
| nfc_token            | string   | 是   | NFC标签唯一token            | "token_abcd1234"              |
| photo_urls           | string[] | 是   | 4张包裹照片URL              | ["url1",..."url4"]           |
| photo_hashes         | string[] | 是   | 4张包裹照片的SHA-256哈希值  | ["hash1",..."hash4"]          |
| shipping_address_gps | object   | 是   | 配送GPS坐标                 | {lat: 40.71, lng:-74.00}      |
| customer_phone_last4 | string   | 否   | 客户手机号后4位              | "1234"                        |
| warehouse_gps        | object   | 否   | 仓库GPS坐标                 | {lat: 40.75, lng:-73.98}      |

### 响应参数表
| 字段名             | 类型   | 说明                |
|-------------------|--------|---------------------|
| proof_id          | string | 注册记录ID          |
| enrollment_status | string | 注册状态（enrolled）|
| key_id            | string | 签名密钥ID          |

### Examples
**Request:**
```json
{
  "order_id": "ORDER-12345",
  "nfc_uid": "04:1A:2B:3C:4D:5E:6F",
  "nfc_token": "token_abcd1234",
  "photo_urls": ["https://cdn.ink.com/pic1.jpg","https://cdn.ink.com/pic2.jpg","https://cdn.ink.com/pic3.jpg","https://cdn.ink.com/pic4.jpg"],
  "photo_hashes": ["a1b2c3...","d4e5f6...","g7h8i9...","j10k11..."],
  "shipping_address_gps": {"lat": 40.7128, "lng": -74.0060},
  "customer_phone_last4": "1234",
  "warehouse_gps": {"lat": 40.7580, "lng": -73.9855}
}
```
**Response:**
```json
{
  "proof_id": "proof_abc123",
  "enrollment_status": "enrolled",
  "key_id": "key_001"
}
```

---

## 2. POST `/verify` 配送验证
- **功能**：客户交付时验证包裹位置与手机
- **签名字段**：proof_id, order_id, delivery_gps, timestamp, gps_verdict

### 请求参数表
| 字段名       | 类型   | 必填 | 说明          | 示例                  |
|-------------|--------|------|---------------|-----------------------|
| nfc_token   | string | 是   | 注册时的token | "token_abcd1234"     |
| delivery_gps| object | 是   | 交付点GPS     | {lat:40.71,lng:-74.0} |
| device_info | string | 否   | 手机型号等    | "iPhone 13 Pro"      |
| phone_last4 | string | 条件 | 客户手机号后4位(不≤100米必需) | "1234" |

### 响应参数表
| 字段名              | 类型   | 说明                      |
|---------------------|--------|---------------------------|
| proof_id            | string | 注册ID                    |
| verification_status | string | 验证状态（verified等）    |
| gps_verdict         | string | GPS判定(pass/near/flagged)|
| distance_meters     | int    | 交付点与地址的距离（米）   |
| signature           | string | Ed25519签名，见下       |
| verify_url          | string | 争议页面url               |

### Examples
**Request:**
```json
{
  "nfc_token": "token_abcd1234",
  "delivery_gps": {"lat": 40.7129, "lng": -74.0061},
  "device_info": "iPhone 14 Pro",
  "phone_last4": "1234"
}
```
**Response:**
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

---

## 3. GET `/retrieve/{proof_id}` 查询证明

- **功能**：根据proof_id查详细注册与交付信息

### 响应参数表
| 字段名      | 类型     | 说明                                  |
|------------|----------|---------------------------------------|
| proof_id   | string   | 注册ID                                |
| order_id   | string   | 订单ID（脱敏）                        |
| enrollment | object   | 注册环节详情（timestamp, gps,照片）   |
| delivery   | object?  | 配送详情（timestamp,gps,verdict,phone_verified） |
| signature  | string   | 最新Ed25519签名                       |
| public_key | string   | 公钥hex                               |
| key_id     | string   | Key标识                               |

### Examples
**Response:**
```json
{
  "proof_id": "proof_abc123",
  "order_id": "ORDE***345",
  "enrollment": {
    "timestamp": "2024-01-01T12:00:00Z",
    "shipping_address_gps": {"lat": 40.7128, "lng": -74.0060},
    "photo_urls": ["https://cdn.ink.com/pic1.jpg","https://cdn.ink.com/pic2.jpg","https://cdn.ink.com/pic3.jpg","https://cdn.ink.com/pic4.jpg"]
  },
  "delivery": {
    "timestamp": "2024-01-01T14:30:00Z",
    "delivery_gps": {"lat": 40.7129, "lng": -74.0061},
    "gps_verdict": "pass",
    "phone_verified": true
  },
  "signature": "hex_signature",
  "public_key": "hex_public_key",
  "key_id": "key_001"
}
```

---

## 4. GET `/.well-known/jwks.json` 公钥获取

### 响应参数表
| 字段名 | 类型   | 说明           |
|--------|--------|----------------|
| keys   | array  | JWKS公钥数组   |

### Examples
**Response:**
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

---

## 5. GET `/health` 服务健康

### 响应参数表
| 字段名   | 类型    | 说明         |
|----------|---------|--------------|
| status   | string  | 健康状态     |
| timestamp| string  | 服务器时间戳 |

### Examples
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

## Webhook 通知

- **发送时机**：配送验证成功后自动POST到 `.env` 里的 `SHOPIFY_WEBHOOK_URL`
- **重试**：失败自动重试3次，2s/4s/8s间隔

**请求头：**
- `X-INK-Signature`：HMAC-SHA256签名，密钥为 `.env` 里的 `HMAC_SECRET`

**body字段说明：**
| 字段           | 类型   | 说明                  |
|----------------|--------|----------------------|
| order_id       | string | 订单ID               |
| status         | string | 验证状态（verified）  |
| delivery_gps   | object | 客户当时gps          |
| gps_verdict    | string | pass/near/flagged    |
| proof_ref      | string | 注册ID               |
| timestamp      | string | 提交iso时间          |
| verify_url     | string | 争议页面URL          |

### HMAC签名算法说明
- 字符串化payload(JSON.stringify)，用HMAC_SHA256和HMAC_SECRET签名，得hex
- 对比header里的 `X-INK-Signature`

---

## 错误码定义
| 状态码 | 可能出现接口         | 场景说明                   |
|--------|---------------------|----------------------------|
| 400    | 任意                | 缺少/参数格式错误           |
| 403    | /verify             | 手机后4位不匹配            |
| 404    | /retrieve /verify   | 记录/注册不存在             |
| 500    | 任意                | 服务器内部错误              |

---

## 签名/验签流程
- 所有 `/enroll`, `/verify`, `/retrieve` 响应含 `signature` 字段
- 数据结构详见上面「签名数据结构示例」
- 
1. 用一致字段顺序和内容 `JSON.stringify` 得到消息体（如见文档各API对应部分说明）
2. 用响应的 `public_key`（Ed25519 格式）对消息体和 signature 验证（tweetnacl/jose等库）

---

## 安全说明
- Ed25519签名：防伪/数据不可抵赖
- HMAC签名：webhook请求真实性保证
- 速率限制：100次/小时/IP
- 生产环境建议HTTPS

