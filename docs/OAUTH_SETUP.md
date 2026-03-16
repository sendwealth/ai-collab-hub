# OAuth登录配置指南

本文档介绍如何配置GitHub和Google OAuth登录功能。

## 目录

1. [GitHub OAuth配置](#github-oauth配置)
2. [Google OAuth配置](#google-oauth配置)
3. [环境变量配置](#环境变量配置)
4. [测试OAuth流程](#测试oauth流程)
5. [常见问题](#常见问题)

---

## GitHub OAuth配置

### 1. 创建GitHub OAuth应用

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "OAuth Apps" → "New OAuth App"
3. 填写应用信息：

   - **Application name**: `AI协作平台` (或您的应用名称)
   - **Homepage URL**: 
     - 开发环境: `http://localhost:3001`
     - 生产环境: `https://your-domain.com`
   - **Authorization callback URL**:
     - 开发环境: `http://localhost:3000/api/v1/auth/github/callback`
     - 生产环境: `https://api.your-domain.com/api/v1/auth/github/callback`

4. 点击 "Register application"

### 2. 获取凭证

1. 在应用详情页面，找到 **Client ID**
2. 点击 "Generate a new client secret" 生成 **Client Secret**
3. 复制这两个值，稍后配置到环境变量中

### 3. 权限说明

GitHub OAuth默认请求以下权限：
- `user:email` - 读取用户邮箱地址（用于用户身份识别）

---

## Google OAuth配置

### 1. 创建Google Cloud项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 记下项目ID

### 2. 配置OAuth同意屏幕

1. 在左侧菜单选择 "APIs & Services" → "OAuth consent screen"
2. 选择用户类型：
   - **External** - 任何Google账户都可以登录（推荐用于测试）
   - **Internal** - 仅限组织内部用户
3. 填写应用信息：
   - **App name**: `AI协作平台`
   - **User support email**: 您的邮箱
   - **Developer contact email**: 您的邮箱
4. 点击 "Save and Continue"
5. 配置作用域（Scopes）：
   - `openid` - OpenID Connect
   - `email` - 用户邮箱
   - `profile` - 用户基本信息
6. 点击 "Save and Continue"
7. 添加测试用户（如果是External模式且未发布）

### 3. 创建OAuth 2.0凭证

1. 在左侧菜单选择 "APIs & Services" → "Credentials"
2. 点击 "Create Credentials" → "OAuth client ID"
3. 选择应用类型：**Web application**
4. 填写应用信息：
   - **Name**: `AI协作平台 Web Client`
   - **Authorized JavaScript origins**:
     - 开发环境: `http://localhost:3001`
     - 生产环境: `https://your-domain.com`
   - **Authorized redirect URIs**:
     - 开发环境: `http://localhost:3000/api/v1/auth/google/callback`
     - 生产环境: `https://api.your-domain.com/api/v1/auth/google/callback`
5. 点击 "Create"
6. 复制 **Client ID** 和 **Client Secret**

---

## 环境变量配置

在 `apps/server/.env` 文件中添加以下配置：

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_ID="your_github_client_id_here"
GITHUB_CLIENT_SECRET="your_github_client_secret_here"
GITHUB_CALLBACK_URL="http://localhost:3000/api/v1/auth/github/callback"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/v1/auth/google/callback"

# Frontend URL (for OAuth redirects)
FRONTEND_URL="http://localhost:3001"

# JWT Configuration
JWT_SECRET="your_jwt_secret_here"
JWT_REFRESH_SECRET="your_refresh_secret_here"
```

### 生产环境配置

在生产环境中，需要更新以下配置：

```env
# GitHub OAuth
GITHUB_CALLBACK_URL="https://api.your-domain.com/api/v1/auth/github/callback"

# Google OAuth
GOOGLE_CALLBACK_URL="https://api.your-domain.com/api/v1/auth/google/callback"

# Frontend URL
FRONTEND_URL="https://your-domain.com"

# JWT (使用强密码)
JWT_SECRET="use-a-strong-random-string-here"
JWT_REFRESH_SECRET="use-another-strong-random-string-here"
```

---

## 测试OAuth流程

### 测试GitHub登录

1. 启动后端服务：
   ```bash
   cd apps/server
   npm run start:dev
   ```

2. 启动前端服务：
   ```bash
   cd apps/web
   npm run dev
   ```

3. 访问 `http://localhost:3001/login`

4. 点击 "GitHub" 按钮

5. 验证以下步骤：
   - ✓ 跳转到GitHub授权页面
   - ✓ 显示正确的应用名称
   - ✓ 授权后重定向回应用
   - ✓ 成功登录并跳转到dashboard

### 测试Google登录

1. 重复上述步骤，但点击 "Google" 按钮

2. 验证以下步骤：
   - ✓ 跳转到Google授权页面
   - ✓ 显示正确的应用信息
   - ✓ 授权后重定向回应用
   - ✓ 成功登录并跳转到dashboard

### API测试

也可以直接测试API端点：

```bash
# 测试GitHub OAuth URL生成
curl http://localhost:3000/api/v1/auth/github

# 测试Google OAuth URL生成
curl http://localhost:3000/api/v1/auth/google
```

---

## 常见问题

### 1. "OAuth not configured" 错误

**原因**: 环境变量未正确配置

**解决方案**: 
- 检查 `.env` 文件中的 `GITHUB_CLIENT_ID` 和 `GOOGLE_CLIENT_ID`
- 确保后端服务已重启以加载新的环境变量

### 2. "Redirect URI mismatch" 错误

**原因**: 回调URL配置不匹配

**解决方案**:
- GitHub: 检查 OAuth App 设置中的 "Authorization callback URL"
- Google: 检查 Credentials 中的 "Authorized redirect URIs"
- 确保与 `.env` 中的 `CALLBACK_URL` 完全一致（包括 http/https）

### 3. Google登录提示"未验证应用"

**原因**: OAuth应用处于测试模式且未发布

**解决方案**:
- 在Google Cloud Console中添加测试用户邮箱
- 或发布应用（Publish App）使其对所有人可用

### 4. 授权后无法获取邮箱

**原因**: GitHub用户邮箱设置为私密

**解决方案**: 
- 代码已处理此情况，会尝试获取私密邮箱
- 确保请求了 `user:email` 权限

### 5. "Invalid OAuth state" 错误

**原因**: CSRF保护验证失败

**解决方案**:
- 确保浏览器启用了Cookie
- 检查cookie的secure设置（开发环境应为false）
- 清除浏览器cookie后重试

### 6. Token验证失败

**原因**: JWT配置不一致

**解决方案**:
- 确保 `JWT_SECRET` 和 `JWT_REFRESH_SECRET` 已正确配置
- 检查token是否过期
- 验证前端和后端使用相同的密钥

---

## 安全建议

1. **生产环境必须使用HTTPS**
   - OAuth回调URL必须使用HTTPS
   - Cookie设置 `secure: true`

2. **保护Client Secret**
   - 永远不要在前端代码中暴露Client Secret
   - 使用环境变量管理敏感信息
   - 定期轮换密钥

3. **State参数验证**
   - 代码已实现state参数的生成和验证
   - 防止CSRF攻击

4. **Token存储**
   - 使用httpOnly cookie存储敏感token
   - 考虑使用短期access token + 长期refresh token

5. **权限最小化**
   - 只请求必要的OAuth权限
   - 定期审查请求的scope

---

## 支持的功能

- ✅ GitHub OAuth登录
- ✅ Google OAuth登录
- ✅ 自动创建/更新用户信息
- ✅ JWT Token生成
- ✅ CSRF保护（State参数）
- ✅ 错误处理和重定向
- ✅ 开发/生产环境配置

## 未来改进

- [ ] 添加更多OAuth提供商（Microsoft, Twitter等）
- [ ] 实现OAuth账号绑定（一个用户多个登录方式）
- [ ] 添加登录日志和审计
- [ ] 支持企业级SSO（SAML, LDAP）
- [ ] 多因素认证（MFA）

---

## 相关链接

- [GitHub OAuth文档](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Google OAuth 2.0文档](https://developers.google.com/identity/protocols/oauth2)
- [NestJS Passport文档](https://docs.nestjs.com/security/authentication)
