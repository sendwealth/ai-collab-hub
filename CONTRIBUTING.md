# 贡献指南

感谢你对AI协作平台的关注！本文档将帮助你参与项目开发。

## 📋 行为准则

- 尊重所有贡献者
- 接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

## 🤔 我可以如何贡献？

### 报告Bug

1. 检查 [Issues](../../issues) 中是否已有相同问题
2. 如果没有，创建新Issue
3. 使用Bug报告模板
4. 提供详细的复现步骤

### 建议新功能

1. 检查 [Issues](../../issues) 中是否已有相同建议
2. 如果没有，创建新Issue
3. 使用功能请求模板
4. 详细描述功能和使用场景

### 提交代码

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 阅读项目文档（[ARCHITECTURE.md](./ARCHITECTURE.md)、[AI_COLLABORATION.md](./AI_COLLABORATION.md)）
4. 编写代码
5. 编写测试
6. 提交PR

## 🔧 开发流程

### 1. 环境准备

```bash
# 克隆你的fork
git clone https://github.com/YOUR_USERNAME/ai-collab-hub.git
cd ai-collab-hub

# 安装依赖
pnpm install

# 启动开发环境
./init-project.sh
```

### 2. 创建分支

```bash
# 从develop创建特性分支
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 3. 开发

- 遵循 [ARCHITECTURE.md](./ARCHITECTURE.md) 中的架构规范
- 遵循 [AI_COLLABORATION.md](./AI_COLLABORATION.md) 中的协作规约
- 编写测试
- 保持代码质量

### 4. 提交

```bash
# 使用规范的提交信息
git commit -m "feat(module): add amazing feature"
```

提交信息格式：
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

### 5. 推送

```bash
git push origin feature/your-feature-name
```

### 6. 创建PR

1. 访问你fork的GitHub页面
2. 点击 "New Pull Request"
3. 填写PR模板
4. 等待审查

## 📏 代码规范

### TypeScript

- 使用严格模式
- 避免any类型
- 使用接口定义类型

### 命名规范

```typescript
// 文件: kebab-case.ts
// 组件: PascalCase.tsx
// 变量: camelCase
// 常量: UPPER_SNAKE_CASE
// 类/接口: PascalCase
```

### 注释

```typescript
/**
 * 函数描述
 * @param param1 - 参数描述
 * @returns 返回值描述
 */
function example(param1: string): string {
  // ...
}
```

## ✅ 测试要求

- 单元测试覆盖率 > 80%
- 关键路径必须有E2E测试
- 测试用例清晰明了
- Mock使用合理

```bash
# 运行测试
pnpm test

# 测试覆盖率
pnpm test:cov
```

## 📖 文档规范

- 代码变更必须更新相关文档
- API变更必须更新API文档
- 新功能必须添加使用示例
- README保持最新

## 🔍 代码审查

### 审查标准

- ✅ 代码符合规范
- ✅ 架构设计合理
- ✅ 测试覆盖充分
- ✅ 文档完整清晰
- ✅ 无安全隐患

### 审查流程

1. 自动化检查（CI）
2. 架构审查（架构师）
3. 代码审查（同行）
4. 最终审批

## 🏷️ Issue/PR标签

- `bug`: Bug报告
- `enhancement`: 功能请求
- `documentation`: 文档相关
- `good first issue`: 适合新手
- `help wanted`: 需要帮助
- `priority: high/medium/low`: 优先级
- `status: in progress/blocked/review needed`: 状态

## 💬 获取帮助

- [GitHub Discussions](../../discussions) - 提问和讨论
- [Issues](../../issues) - Bug报告和功能请求
- 查看项目文档

## 📜 许可证

通过贡献代码，你同意你的代码将按照项目的MIT许可证进行许可。

---

感谢你的贡献！🎉
