# Firestore 快速修复指南

## 错误: `5 NOT_FOUND`

这个错误表示 Firestore 数据库还没有在 Firebase 项目中创建。

## 解决步骤

### 1. 启用 Firestore Database

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择项目: `inink-c76d3`
3. 点击左侧菜单: **Build** → **Firestore Database**
4. 点击: **Create database**
5. 选择模式:
   - **Test mode** (开发用，30天后过期)
   - **Production mode** (生产用，需要配置安全规则)
6. 选择位置: 选择最近的区域 (例如: `us-central1`, `asia-east1`)
7. 点击: **Enable**

### 2. 配置安全规则 (Production mode)

如果选择了 Production mode，需要配置安全规则:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow server (Admin SDK) to read/write everything
    match /{document=**} {
      allow read, write: if false; // Only Admin SDK can access
    }
  }
}
```

**注意**: 使用 Admin SDK 时，安全规则不会限制访问（Admin SDK 有完全权限）。

### 3. 测试连接

数据库创建完成后，运行:

```bash
node test-firestore.js
```

应该看到:
```
✓ Firebase Admin initialized
✓ Firestore connected and writable
✓ Read test successful
✓ Cleanup successful
=== All tests passed! ===
```

## 常见问题

### Q: 我已经创建了数据库，还是报错？
A: 检查服务账户密钥文件是否是最新的，项目 ID 是否正确。

### Q: 我应该选择哪个模式？
A: 
- **开发阶段**: 选择 Test mode（简单快速）
- **生产环境**: 选择 Production mode（更安全）

### Q: 选择哪个位置？
A: 选择离你的用户最近的区域:
- 美国用户: `us-central1`
- 亚洲用户: `asia-east1` 或 `asia-northeast1`
- 欧洲用户: `europe-west1`

## 下一步

数据库创建成功后:
1. ✅ 运行 `node setup.js` 完成设置
2. ✅ 运行 `npm run dev` 启动服务器
3. ✅ 测试 API 端点

