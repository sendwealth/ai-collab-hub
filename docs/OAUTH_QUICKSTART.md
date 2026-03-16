# OAuth登录 - 快速开始指南

5分钟快速启用GitHub和Google OAuth登录功能。

## 🚀 快速配置步骤

### 1️⃣ 创建GitHub OAuth应用 (2分钟)

1. 访问: https://github.com/settings/developers
2. 点击 "New OAuth App"
3. 填写信息:
   ```
   Application name: AI协作平台
   Homepage URL: http://localhost:3001
   Callback URL: http://localhost:3000/api/v1/auth/github/callback
   ```
4. 复制 Client ID 和 Client Secret

### 2️⃣ 创建Google OAuth应用 (2分钟)

1. 访问: https://console.cloud.google.com/apis/credentials
2. 创建OAuth客户端ID → Web应用
3. 配置:
   ```
   授权JavaScript来源: http://localhost:3001
   授权重定向URI: http://localhost:3000/api/v1/auth/google/callback
   ```
4. 复制 Client ID 和 Client Secret

### 3️⃣ 配置环境变量 (1分钟)

编辑 `apps/server/.env`:

```env
# 替换为你的实际凭证
GITHUB_CLIENT_ID="你的GitHub Client ID"
GITHUB_CLIENT_SECRET="你的GitHub Client Secret"

GOOGLE_CLIENT_ID="你的Google Client ID"
GOOGLE_CLIENT_SECRET="你的Google Client Secret"
```

### 4️⃣ 启动服务 (1分钟)

```bash
# 启动后端
cd apps/server
npm run start:dev

# 新终端 - 启动前端
cd apps/web
npm run dev
```

### 5️⃣ 测试登录

1. 访问 http://localhost:3001/login
2. 点击 GitHub 或 Google 按钮
3. 授权应用
4. 自动登录成功 ✅

## 📋 详细文档

- [完整配置指南](./OAUTH_SETUP.md)
- [测试报告](./OAUTH_TEST_REPORT.md)
- [实现总结](./OAUTH_IMPLEMENTATION.md)

## ⚠️ 注意事项

### 开发环境

- 使用 `http://localhost` 协议
- Cookie secure设置为false
- 可以使用测试账号

### 生产环境

**必须修改**:
```env
# 使用HTTPS
GITHUB_CALLBACK_URL="https://api.your-domain.com/api/v1/auth/github/callback"
GOOGLE_CALLBACK_URL="https://api.your-domain.com/api/v1/auth/google/callback"
FRONTEND_URL="https://your-domain.com"

# 更新GitHub/Google应用配置
# 使用生产域名
```

**安全配置**:
- 使用强随机JWT密钥
- 启用HTTPS
- Cookie设置secure flag
- 定期轮换密钥

## 🔧 故障排除

### 问题1: 点击按钮没反应

**检查**:
- 后端服务是否启动
- 浏览器控制台是否有错误
- 网络请求是否发出

### 问题2: "OAuth not configured"错误

**解决**:
- 检查.env文件配置
- 确保环境变量名称正确
- 重启后端服务

### 问题3: "Redirect URI mismatch"错误

**解决**:
- 检查GitHub/Google应用配置
- 确保回调URL完全匹配（包括http/https）
- 检查.env中的CALLBACK_URL

### 问题4: Google登录显示"未验证应用"

**解决**:
- 在Google Cloud Console添加测试用户
- 或发布应用（Publish App）

## 📞 获取帮助

- 查看详细文档: [OAUTH_SETUP.md](./OAUTH_SETUP.md)
- 查看测试报告: [OAUTH_TEST_REPORT.md](./OAUTH_TEST_REPORT.md)
- 提交Issue: 项目GitHub仓库

## ✅ 检查清单

配置前检查:
- [ ] 已创建GitHub OAuth应用
- [ ] 已创建Google OAuth应用
- [ ] 已配置环境变量
- [ ] 已启动后端服务
- [ ] 已启动前端服务

测试检查:
- [ ] GitHub登录按钮可点击
- [ ] GitHub授权页面正常显示
- [ ] GitHub授权后成功登录
- [ ] Google登录按钮可点击
- [ ] Google授权页面正常显示
- [ ] Google授权后成功登录
- [ ] 登录后跳转到dashboard
- [ ] 用户信息正确显示

## 🎉 完成！

恭喜！你已成功配置OAuth登录功能。

现在用户可以:
- ✅ 使用GitHub账号快速登录
- ✅ 使用Google账号快速登录
- ✅ 自动创建账户
- ✅ 同步用户信息

享受更便捷的用户体验！
