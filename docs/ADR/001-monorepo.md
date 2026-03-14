# ADR-001: 采用Monorepo项目结构

## 状态
Accepted

## 背景
本项目包含多个应用（Web前端、后端服务、Agent SDK）和多个共享包（类型定义、工具库）。需要决定代码仓库的组织方式。

## 决策
采用 **Monorepo** 单一仓库结构，使用 **pnpm + Turborepo** 作为管理工具。

### 仓库结构
```
ai-collab-hub/
├── apps/           # 应用程序
│   ├── web/        # Web前端
│   ├── server/     # 后端服务
│   └── agent-sdk/  # Agent SDK
├── packages/       # 共享包
│   ├── types/      # 类型定义
│   ├── utils/      # 工具库
│   ├── eslint-config/
│   └── tsconfig/
├── docs/           # 文档
└── infra/          # 基础设施
```

### 工具选择
- **pnpm**: 节省磁盘空间，严格的依赖管理
- **Turborepo**: 增量构建，任务并行，远程缓存

## 理由

### 为什么选择Monorepo
1. **代码共享**: 类型定义、工具库在前后端间共享
2. **原子提交**: 跨项目修改可以在一个PR中完成
3. **统一版本**: 所有包版本同步管理
4. **简化协作**: AI Agent只需关注一个仓库

### 为什么选择pnpm + Turborepo
1. **pnpm**:
   - 比npm/yarn更快
   - 节省磁盘空间（符号链接）
   - 严格的依赖管理（避免幽灵依赖）

2. **Turborepo**:
   - 智能增量构建
   - 任务并行执行
   - 远程缓存（CI加速）
   - 比Nx更轻量

## 后果

### 正面影响
- 前后端类型定义统一
- 重构更容易（跨项目）
- CI/CD配置统一
- 依赖版本统一

### 负面影响
- 仓库体积可能较大
- 需要学习pnpm和Turborepo
- CI时间可能较长（需优化）

## 替代方案

### Multi-repo
每个应用/包一个独立仓库。

**不选择原因**:
- 跨仓库重构困难
- 依赖版本难以同步
- AI Agent需要管理多个仓库

### Nx
使用Nx作为Monorepo工具。

**不选择原因**:
- 学习曲线较陡
- 功能过于复杂（本项目不需要）
- Turborepo更轻量足够

## 参考
- [pnpm官方文档](https://pnpm.io/)
- [Turborepo官方文档](https://turbo.build/)
