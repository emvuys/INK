# Verify 端点 GPS 距离计算说明

## 概述

`POST /verify` 端点通过计算**交付GPS坐标**（客户点击NFC标签时的位置）与**配送地址GPS坐标**（注册时保存的配送地址）之间的距离，来判断配送是否在正确位置。

---

## 数据流程

### 1. 注册阶段（Enroll）- 保存配送地址GPS

当商家注册包裹时，`POST /enroll` 端点会接收并保存配送地址GPS：

```javascript
// 注册时接收的数据
{
  "shipping_address_gps": {
    "lat": 40.7128,  // 配送地址纬度
    "lng": -74.0060  // 配送地址经度
  }
}

// 保存到数据库 proofs 集合
proofData = {
  shipping_address_gps: shipping_address_gps,  // 保存配送地址GPS
  // ... 其他数据
}
```

### 2. 验证阶段（Verify）- 计算距离

当客户点击NFC标签时，`POST /verify` 端点会：

#### 步骤1：接收交付GPS坐标

```javascript
// 客户端发送的数据
{
  "nfc_token": "token_test_abc123",
  "delivery_gps": {
    "lat": 40.7129,  // 客户点击时的纬度
    "lng": -74.0061  // 客户点击时的经度
  }
}
```

#### 步骤2：从数据库获取配送地址GPS

```javascript
// 通过 nfc_token 查找注册记录
const proof = proofDoc.data();

// 获取注册时保存的配送地址GPS
const shippingGps = proof.shipping_address_gps;
// shippingGps = { lat: 40.7128, lng: -74.0060 }
```

#### 步骤3：计算两点之间的距离

```javascript
// 使用 Haversine 公式计算距离
const distance = calculateDistance(
  delivery_gps.lat,      // 交付纬度：40.7129
  delivery_gps.lng,      // 交付经度：-74.0061
  shippingGps.lat,      // 配送地址纬度：40.7128
  shippingGps.lng       // 配送地址经度：-74.0060
);
// 返回距离（单位：米）
```

---

## 距离计算算法：Haversine 公式

### 算法原理

Haversine 公式用于计算地球表面两点之间的大圆距离（最短距离），适用于球面几何。

### 代码实现

位置：`src/utils/gps.js`

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // 地球半径（米）：6,371,000米
  
  // 将角度转换为弧度
  const φ1 = lat1 * Math.PI / 180;  // 纬度1（弧度）
  const φ2 = lat2 * Math.PI / 180;  // 纬度2（弧度）
  const Δφ = (lat2 - lat1) * Math.PI / 180;  // 纬度差（弧度）
  const Δλ = (lon2 - lon1) * Math.PI / 180;  // 经度差（弧度）

  // Haversine 公式
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // 返回距离（米）
  return R * c;
}
```

### 公式说明

1. **R = 6371e3**：地球平均半径 = 6,371,000 米
2. **角度转弧度**：将经纬度从度数转换为弧度（π/180）
3. **Haversine 公式**：
   - `a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)`
   - `c = 2 × atan2(√a, √(1-a))`
   - `distance = R × c`

### 精度

- **精度**：对于短距离（< 100公里），误差通常在 0.5% 以内
- **适用场景**：适合计算配送验证场景（通常距离 < 1公里）

---

## GPS 判定规则

根据计算出的距离，系统会给出不同的判定：

位置：`src/utils/gps.js`

```javascript
function getGpsVerdict(distanceMeters) {
  if (distanceMeters <= 100) return 'pass';      // ≤ 100米：通过
  if (distanceMeters <= 300) return 'near';     // 100-300米：接近
  return 'flagged';                              // > 300米：标记
}
```

### 判定标准

| 距离范围 | 判定结果 | 说明 | 是否需要手机验证 |
|---------|---------|------|----------------|
| ≤ 100米 | `pass` | 自动通过 | ❌ 不需要 |
| 100-300米 | `near` | 接近地址 | ✅ 需要 |
| > 300米 | `flagged` | 标记为异常 | ✅ 需要 |

---

## 验证流程

### 完整验证逻辑

位置：`src/routes/verify.js` (第43-72行)

```javascript
// 1. 计算距离
const shippingGps = proof.shipping_address_gps;
const distance = calculateDistance(
  delivery_gps.lat,
  delivery_gps.lng,
  shippingGps.lat,
  shippingGps.lng
);

// 2. 获取GPS判定
const verdict = getGpsVerdict(distance);

// 3. 根据距离决定是否需要手机验证
let phoneVerified = false;

if (distance > 100) {
  // 距离 > 100米，需要手机验证
  if (!phone_last4) {
    return res.status(400).json({ 
      error: 'Phone verification required',
      requires_phone: true
    });
  }

  // 验证手机号后4位
  if (phone_last4 !== proof.customer_phone_last4) {
    return res.status(403).json({ error: 'Phone verification failed' });
  }

  phoneVerified = true;
}
```

---

## 实际示例

### 示例1：距离很近（自动通过）

**注册时**：
```json
{
  "shipping_address_gps": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

**验证时**：
```json
{
  "delivery_gps": {
    "lat": 40.7129,  // 相差约 0.0001 度
    "lng": -74.0061  // 约等于 11 米
  }
}
```

**结果**：
- 距离：约 11 米
- 判定：`pass`
- 手机验证：不需要 ✅

### 示例2：距离中等（需要手机验证）

**验证时**：
```json
{
  "delivery_gps": {
    "lat": 40.7135,  // 相差约 0.0007 度
    "lng": -74.0070  // 约等于 150 米
  },
  "phone_last4": "1234"
}
```

**结果**：
- 距离：约 150 米
- 判定：`near`
- 手机验证：需要 ✅（如果提供正确的后4位）

### 示例3：距离很远（标记异常）

**验证时**：
```json
{
  "delivery_gps": {
    "lat": 41.0000,  // 相差约 0.3 度
    "lng": -74.5000  // 约等于 50,000 米（50公里）
  },
  "phone_last4": "1234"
}
```

**结果**：
- 距离：约 50,000 米
- 判定：`flagged`
- 手机验证：需要 ✅（即使提供手机号，也会标记为异常）

---

## 返回数据

验证成功后，API 会返回距离信息：

```json
{
  "proof_id": "proof_abc123",
  "verification_status": "verified",
  "gps_verdict": "pass",
  "distance_meters": 11,  // 计算出的距离（米）
  "signature": "...",
  "verify_url": "https://in.ink/verify/proof_abc123"
}
```

---

## 输入验证

代码中包含 GPS 坐标的输入验证（`src/utils/gps.js`）：

```javascript
// 验证输入
if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || 
    typeof lat2 !== 'number' || typeof lon2 !== 'number') {
  throw new Error('Invalid GPS coordinates: all parameters must be numbers');
}

if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
  throw new Error('Invalid latitude: must be between -90 and 90');
}

if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
  throw new Error('Invalid longitude: must be between -180 and 180');
}
```

---

## 总结

1. **注册阶段**：保存配送地址GPS坐标到数据库
2. **验证阶段**：
   - 接收客户点击时的GPS坐标（delivery_gps）
   - 从数据库获取注册时的配送地址GPS（shipping_address_gps）
   - 使用 Haversine 公式计算两点间距离（米）
   - 根据距离判断是否需要手机验证
3. **判定规则**：
   - ≤ 100米：自动通过
   - 100-300米：接近，需要手机验证
   - > 300米：异常，需要手机验证

这种设计确保了配送验证的准确性，同时通过GPS距离判断减少了不必要的手机验证步骤，提升了用户体验。

