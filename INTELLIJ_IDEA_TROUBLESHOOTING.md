# IntelliJ IDEA HTTP Client 故障排除

## 问题：变量无法解析

### 错误信息
```
java.net.UnknownHostException: baseUrl=
```

### 解决方案

#### 方案1：使用直接URL（推荐，最简单）

我已经创建了 `test-api.http` 文件，使用直接URL，不依赖变量：
```http
GET http://localhost:8000/health
```

**优点**：
- ✅ 所有IntelliJ IDEA版本都支持
- ✅ 不需要配置
- ✅ 直接可用

#### 方案2：使用环境文件

1. 创建 `http-client.env.json` 文件（已创建）
2. 在请求中使用环境变量：
```http
GET {{baseUrl}}/health
```

3. 选择环境：
   - 点击IntelliJ IDEA右上角的环境选择器
   - 选择 `dev`, `prod`, 或 `staging`

#### 方案3：检查IntelliJ IDEA版本

- **IntelliJ IDEA 2017.3+**: 支持内置HTTP Client
- **IntelliJ IDEA 2020.1+**: 支持环境文件
- **IntelliJ IDEA 2022.1+**: 支持更多变量功能

如果变量不工作，可能是版本问题，使用方案1即可。

## 问题：看不到绿色箭头

### 解决方案

1. **检查文件扩展名**
   - 确保文件是 `.http` 或 `.rest`
   - 如果文件没有扩展名，重命名为 `test-api.http`

2. **检查插件**
   - `File` → `Settings` → `Plugins`
   - 搜索 "HTTP Client"
   - 确保已启用

3. **重启IntelliJ IDEA**
   - 有时需要重启才能识别HTTP文件

## 问题：请求失败

### 常见错误

#### 1. Connection refused
```
java.net.ConnectException: Connection refused
```
**解决**：确保服务器运行 (`npm run dev`)

#### 2. 404 Not Found
**解决**：检查URL是否正确，服务器是否在正确的端口运行

#### 3. 500 Internal Server Error
**解决**：查看服务器日志，检查代码错误

## 推荐使用方式

### 开发测试
使用 `test-api.http`（直接URL，无变量）
- 简单直接
- 无需配置
- 所有版本支持

### 多环境测试
使用 `http-client.env.json` + 环境变量
- 支持多环境切换
- 更灵活
- 需要IntelliJ IDEA 2020.1+

## 快速测试

1. 打开 `test-api.http`
2. 确保服务器运行：`npm run dev`
3. 点击请求上方的绿色箭头
4. 查看响应结果

## 其他测试工具

如果IntelliJ IDEA HTTP Client有问题，可以使用：

1. **Postman** - 最流行的API测试工具
2. **curl** - 命令行工具
3. **PowerShell脚本** - `test-api.ps1`
4. **VS Code REST Client** - 如果有VS Code

## 示例请求

### 最简单的测试
```http
GET http://localhost:8000/health
```

### 带JSON body的请求
```http
POST http://localhost:8000/enroll
Content-Type: application/json

{
  "order_id": "ORDER-12345",
  "nfc_token": "token123"
}
```

## 需要帮助？

如果还有问题：
1. 检查IntelliJ IDEA版本
2. 尝试使用直接URL（不使用变量）
3. 查看服务器日志
4. 使用其他测试工具（Postman、curl等）

