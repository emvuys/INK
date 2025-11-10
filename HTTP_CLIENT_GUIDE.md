# IntelliJ IDEA HTTP Client 使用指南

## 问题解决

如果你看到 "Invalid URI because of unsubstituted variable 'baseUrl'" 错误，请按照以下步骤操作：

## 方法 1: 使用环境文件（推荐）

1. **环境文件已创建**: `http-client.env.json`
   - 包含 `production` 和 `local` 两个环境
   - 生产环境: `http://193.57.137.90:8000`
   - 本地环境: `http://localhost:8000`

2. **在 IntelliJ IDEA 中选择环境**:
   - 打开 `test-api.http` 文件
   - 在编辑器右上角找到环境选择器（显示 "No Environment" 或当前环境）
   - 点击并选择 `production` 或 `local`
   - 现在所有 `{{baseUrl}}` 变量都会被正确替换

## 方法 2: 直接替换变量（快速修复）

如果环境文件不工作，可以手动替换：

1. 在 `test-api.http` 文件中
2. 使用查找替换功能（Ctrl+R）
3. 查找: `{{baseUrl}}`
4. 替换为: `http://193.57.137.90:8000`（生产环境）
   或 `http://localhost:8000`（本地环境）

## 方法 3: 使用 VS Code REST Client

如果你使用 VS Code：

1. 安装 "REST Client" 扩展
2. 打开 `test-api.http` 文件
3. 变量会自动识别，点击 "Send Request" 即可

## 测试步骤

1. **选择环境**: 在 IntelliJ IDEA 右上角选择 `production`
2. **运行健康检查**: 点击第一个请求（Health Check）旁边的绿色箭头
3. **查看响应**: 应该返回 `{"status":"ok","timestamp":"..."}`

## 常见问题

### Q: 仍然显示变量未替换？
A: 确保：
- 环境文件 `http-client.env.json` 存在于项目根目录
- 在 IntelliJ IDEA 中选择了正确的环境
- 重启 IntelliJ IDEA（有时需要）

### Q: 如何切换环境？
A: 在编辑器右上角的环境选择器中切换，或修改 `http-client.env.json` 文件

### Q: 可以同时测试多个环境吗？
A: 可以，但需要手动切换环境选择器

## 环境文件格式

`http-client.env.json` 文件格式：

```json
{
  "production": {
    "baseUrl": "http://193.57.137.90:8000",
    "contentType": "application/json"
  },
  "local": {
    "baseUrl": "http://localhost:8000",
    "contentType": "application/json"
  }
}
```

## 快速测试命令

如果 HTTP Client 不工作，可以使用 PowerShell：

```powershell
# 测试生产服务器
Invoke-WebRequest -Uri "http://193.57.137.90:8000/health" -Method GET

# 测试本地服务器
Invoke-WebRequest -Uri "http://localhost:8000/health" -Method GET
```

