# IntelliJ IDEA API 测试指南

## 方法1: 使用内置 HTTP Client（推荐）

IntelliJ IDEA 从 2017.3 版本开始内置了 HTTP Client，无需安装插件！

### 使用步骤

1. **打开测试文件**
   - 在项目中打开 `test-api.http` 文件
   - IntelliJ IDEA 会自动识别为 HTTP Client 文件

2. **运行请求**
   - 每个请求上方会显示绿色的 ▶️ 箭头
   - 点击箭头即可运行该请求
   - 或者使用快捷键 `Ctrl+Enter` (Windows/Linux) 或 `Cmd+Enter` (Mac)

3. **查看响应**
   - 响应会显示在右侧面板
   - 可以查看状态码、响应头、响应体
   - 支持 JSON 格式化显示

4. **使用变量**
   - 文件顶部定义了 `@baseUrl` 变量
   - 可以在所有请求中使用 `{{baseUrl}}`
   - 修改一次，所有请求都会更新

### 功能特性

- ✅ 语法高亮
- ✅ 自动补全
- ✅ 变量支持
- ✅ 环境变量支持
- ✅ 请求历史记录
- ✅ 响应格式化
- ✅ 支持认证（Basic, Bearer Token等）

## 方法2: 安装 REST Client 插件

如果你想使用第三方插件：

1. **安装插件**
   - `File` → `Settings` → `Plugins`
   - 搜索 "REST Client" 或 "RESTful"
   - 安装并重启 IDEA

2. **常用插件**
   - **REST Client** - 类似 VS Code 的 REST Client
   - **RESTful Tool** - 提供 REST API 测试工具
   - **HTTP Client** - 增强版 HTTP 客户端

## 方法3: 使用 Postman 集成

1. **安装 Postman 插件**
   - `File` → `Settings` → `Plugins`
   - 搜索 "Postman"
   - 安装插件

2. **导入 Postman 集合**
   - 可以将 Postman 集合导入到 IDEA
   - 或者从 IDEA 导出到 Postman

## 推荐工作流程

### 开发时测试
1. 使用内置 HTTP Client (`test-api.http`)
2. 快速测试单个端点
3. 查看响应结果

### 复杂场景测试
1. 使用 Postman
2. 创建测试集合
3. 自动化测试流程

## 示例：测试完整流程

1. **运行 "Enroll Package"** → 获取 `proof_id`
2. **复制 `proof_id`** → 更新 "Retrieve Proof" 请求中的 ID
3. **运行 "Verify Delivery"** → 测试验证流程
4. **运行 "Retrieve Proof"** → 查看完整记录

## 环境变量配置

可以在 `.http` 文件中定义多个环境：

```http
### Development
@baseUrl = http://localhost:8000

### Production
@baseUrl = https://api.in.ink

### Staging
@baseUrl = https://staging-api.in.ink
```

## 快捷键

- `Ctrl+Enter` / `Cmd+Enter` - 运行当前请求
- `Ctrl+Shift+Enter` / `Cmd+Shift+Enter` - 运行所有请求
- `Ctrl+/` / `Cmd+/` - 注释/取消注释

## 提示

1. **保存响应**: 右键点击响应 → `Save Response`
2. **复制 cURL**: 右键点击请求 → `Copy as cURL`
3. **格式化 JSON**: 响应面板会自动格式化 JSON
4. **搜索历史**: `Ctrl+Shift+A` → 搜索 "HTTP Client"

## 故障排除

### 问题：看不到绿色箭头
- 确保文件扩展名是 `.http` 或 `.rest`
- 检查是否安装了 HTTP Client 插件（虽然内置，但某些版本可能需要）

### 问题：变量不生效
- 确保变量定义在文件顶部
- 使用 `{{variableName}}` 格式引用变量

### 问题：请求失败
- 检查服务器是否运行 (`npm run dev`)
- 检查 URL 是否正确
- 查看错误信息（通常在响应面板中）

