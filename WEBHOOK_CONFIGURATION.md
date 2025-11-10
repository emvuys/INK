# Webhook 配置指南

## 📋 概述

本系统在包裹配送验证成功后，会自动发送webhook通知到Shopify应用。Webhook使用HMAC-SHA256签名确保安全性，并实现了自动重试机制。

---

## 🔧 配置步骤

### 1. 获取Webhook URL

**Webhook URL 由 Taimoor（Shopify集成开发者）提供**

根据项目需求文档：
- **端点路径**: `/ink/update`
- **完整URL示例**: `https://taimoor-shopify-app.com/ink/update`
- **方法**: POST
- **格式**: JSON

### 2. 配置环境变量

在 `.env` 文件中添加：

```bash
# Shopify Webhook URL (由Taimoor提供)
SHOPIFY_WEBHOOK_URL=https://your-shopify-app.com/ink/update

# HMAC密钥（用于webhook签名，需要与Taimoor共享）
HMAC_SECRET=your_hmac_secret_key_here
```

### 3. 生成HMAC密钥

如果还没有HMAC密钥，运行以下命令生成：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**重要**: 将生成的密钥同时：
1. 添加到你的 `.env` 文件中
2. 分享给Taimoor，用于验证webhook签名

---

## 📡 Webhook 行为

### 如果未配置 SHOPIFY_WEBHOOK_URL

- ✅ **不会报错**
- ✅ `/verify` 端点正常工作
- ℹ️ 日志显示: `[WEBHOOK] SHOPIFY_WEBHOOK_URL not set, skipping webhook`

### 如果配置了 SHOPIFY_WEBHOOK_URL

系统会在配送验证成功后自动发送webhook，包含以下特性：

#### ✅ 自动重试机制

- **最大重试次数**: 3次
- **重试间隔**: 指数退避
  - 第1次失败后等待 **2秒**
  - 第2次失败后等待 **4秒**
  - 第3次失败后等待 **8秒**

#### 📊 重试流程示例

```
尝试 1 → 失败 → 等待 2秒
尝试 2 → 失败 → 等待 4秒
尝试 3 → 失败 → 记录错误
```

#### 🔒 安全性

- 每个webhook请求包含 `X-INK-Signature` 头
- 签名使用HMAC-SHA256算法
- Taimoor端需要验证签名以确保请求来自INK系统

---

## 📤 Webhook 载荷格式

### 请求头

```http
POST /ink/update HTTP/1.1
Host: your-shopify-app.com
Content-Type: application/json
X-INK-Signature: 1a2b3c4d5e6f7g8h9i0j...
```

### 请求体

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

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `order_id` | string | Shopify订单ID |
| `status` | string | 验证状态（固定为"verified"） |
| `delivery_gps` | object | 配送GPS坐标 {lat, lng} |
| `gps_verdict` | string | GPS判定: "pass" / "near" / "flagged" |
| `proof_ref` | string | 证明记录ID（proof_id） |
| `timestamp` | string | 验证时间戳（ISO 8601格式） |
| `verify_url` | string | 争议解决页面URL |

---

## 🔐 签名验证（Taimoor端实现）

Taimoor需要在Shopify应用端验证webhook签名，确保请求来自INK系统。

### Node.js 验证示例

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(req) {
  const signature = req.headers['x-ink-signature'];
  const hmacSecret = process.env.HMAC_SECRET; // 与INK系统共享的密钥
  
  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', hmacSecret)
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

// Express.js 路由示例
app.post('/ink/update', (req, res) => {
  if (!verifyWebhookSignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // 处理webhook数据
  const { order_id, status, delivery_gps, gps_verdict, proof_ref } = req.body;
  
  // 更新Shopify订单状态...
  
  res.json({ success: true });
});
```

详细验证指南请参考: [WEBHOOK_VERIFICATION_GUIDE.md](./WEBHOOK_VERIFICATION_GUIDE.md)

---

## 📝 日志示例

### 成功场景（第1次尝试成功）

```
[WEBHOOK] Generating HMAC signature for webhook
[WEBHOOK] HMAC signature generated
[WEBHOOK] Webhook URL: https://shopify-app.com/ink/update
[WEBHOOK] Attempt 1: Sending webhook to https://shopify-app.com/ink/update
[WEBHOOK] Webhook sent successfully on attempt 1
[WEBHOOK] Response status: 200
[VERIFY] Webhook sent successfully (attempt 1/3)
```

### 重试场景（第2次尝试成功）

```
[WEBHOOK] Attempt 1: Sending webhook to https://shopify-app.com/ink/update
[WEBHOOK] Attempt 1/3 failed: Webhook failed with status 503: Service Unavailable
[WEBHOOK] Retrying in 2 seconds...
[WEBHOOK] Attempt 2: Sending webhook to https://shopify-app.com/ink/update
[WEBHOOK] Webhook sent successfully on attempt 2
[VERIFY] Webhook sent successfully (attempt 2/3)
```

### 失败场景（所有重试失败）

```
[WEBHOOK] Attempt 1: Sending webhook to https://shopify-app.com/ink/update
[WEBHOOK] Attempt 1/3 failed: fetch failed
[WEBHOOK] Retrying in 2 seconds...
[WEBHOOK] Attempt 2: Sending webhook to https://shopify-app.com/ink/update
[WEBHOOK] Attempt 2/3 failed: fetch failed
[WEBHOOK] Retrying in 4 seconds...
[WEBHOOK] Attempt 3: Sending webhook to https://shopify-app.com/ink/update
[WEBHOOK] All 3 attempts failed
[WEBHOOK ERROR] 2024-01-01T14:30:00.000Z
[WEBHOOK ERROR] Message: fetch failed
[WEBHOOK ERROR] Failed after 3 attempts
[VERIFY] Webhook failed after all retries: fetch failed
```

### 未配置场景

```
[WEBHOOK] SHOPIFY_WEBHOOK_URL not set, skipping webhook
[VERIFY] Webhook skipped (SHOPIFY_WEBHOOK_URL not configured)
```

---

## 🧪 测试

### 1. 测试Webhook发送

使用webhook测试服务（如webhook.site）：

```bash
# 在 .env 中设置测试URL
SHOPIFY_WEBHOOK_URL=https://webhook.site/your-unique-id

# 运行验证测试
curl -X POST http://localhost:8000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "nfc_token": "token_test_abc123",
    "delivery_gps": {"lat": 40.7129, "lng": -74.0061},
    "device_info": "Test Device"
  }'
```

### 2. 测试重试逻辑

临时修改 `src/utils/webhook.js` 中的URL为一个不存在的地址，观察重试行为：

```bash
# 在 .env 中设置无效URL
SHOPIFY_WEBHOOK_URL=https://invalid-url-for-testing.com/webhook

# 运行验证，观察日志中的重试过程
```

### 3. 测试签名验证

参考 [WEBHOOK_VERIFICATION_GUIDE.md](./WEBHOOK_VERIFICATION_GUIDE.md) 中的测试代码。

---

## 🚨 故障排查

### Webhook一直失败

**检查清单**:
1. ✅ `SHOPIFY_WEBHOOK_URL` 是否正确配置？
2. ✅ Taimoor的Shopify应用是否在运行？
3. ✅ 网络是否可达？（防火墙、DNS）
4. ✅ Taimoor端是否正确验证签名？
5. ✅ `HMAC_SECRET` 是否与Taimoor端一致？

**调试步骤**:
```bash
# 1. 检查环境变量
echo $SHOPIFY_WEBHOOK_URL

# 2. 测试网络连接
curl -X POST $SHOPIFY_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 3. 查看详细日志
NODE_ENV=development npm run dev
```

### Webhook发送太慢

**原因**: 重试机制可能导致最多等待 14秒（2+4+8）

**解决方案**: 
- ✅ 当前实现已经是**异步发送**，不会阻塞 `/verify` 端点响应
- ✅ 客户端会立即收到验证成功响应
- ℹ️ Webhook在后台重试，不影响用户体验

### 签名验证失败

**常见原因**:
1. `HMAC_SECRET` 不一致
2. 请求体被修改（代理、中间件）
3. 字符编码问题

**解决方案**:
- 确保INK系统和Taimoor端使用相同的 `HMAC_SECRET`
- Taimoor端使用原始请求体计算签名（不要解析后再stringify）
- 参考 [WEBHOOK_VERIFICATION_GUIDE.md](./WEBHOOK_VERIFICATION_GUIDE.md)

---

## 📞 协调与集成

### 需要与Taimoor共享的信息

1. **Webhook URL**: Taimoor提供给我们
2. **HMAC密钥**: 我们生成并共享给Taimoor
3. **载荷格式**: 本文档中的JSON格式
4. **签名验证**: [WEBHOOK_VERIFICATION_GUIDE.md](./WEBHOOK_VERIFICATION_GUIDE.md)

### 集成测试步骤

1. **Taimoor提供测试URL**
   ```
   https://staging.shopify-app.com/ink/update
   ```

2. **我们配置测试环境**
   ```bash
   SHOPIFY_WEBHOOK_URL=https://staging.shopify-app.com/ink/update
   HMAC_SECRET=shared_secret_key_12345
   ```

3. **运行端到端测试**
   - 我们发送测试验证请求
   - Taimoor确认收到webhook
   - Taimoor验证签名成功
   - Taimoor返回200响应

4. **验证重试逻辑**
   - Taimoor临时返回5xx错误
   - 确认我们的系统自动重试
   - Taimoor恢复正常
   - 确认重试成功

---

## 📚 相关文档

- [WEBHOOK_VERIFICATION_GUIDE.md](./WEBHOOK_VERIFICATION_GUIDE.md) - HMAC签名验证详细指南
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - 完整API文档
- [项目需求文档.md](./项目需求文档.md) - 项目需求说明

---

## ✅ 实现状态

- ✅ Webhook发送功能
- ✅ HMAC-SHA256签名
- ✅ 自动重试机制（3次）
- ✅ 指数退避（2s, 4s, 8s）
- ✅ 详细日志记录
- ✅ 异步发送（不阻塞响应）
- ✅ 错误处理
- ✅ 未配置时优雅跳过

**Milestone 1 Webhook要求**: 100% 完成 ✅

---

**更新时间**: 2025-11-10  
**维护者**: Alan (INK NFS Backend)  
**Shopify集成**: Taimoor

