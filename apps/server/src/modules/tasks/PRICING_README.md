# 任务定价系统

智能任务定价系统,基于多维度因素为任务提供合理的价格建议。

## 功能特性

✅ **智能定价算法** - 根据任务类型、复杂度、市场需求等多维度因素自动计算价格
✅ **市场价格参考** - 基于历史数据分析各类任务的市场价格趋势
✅ **复杂度评估** - 自动分析任务描述和需求,评估任务复杂度
✅ **预算范围建议** - 提供最小、推荐、最大三个价格档位
✅ **技能溢价** - 对高价值技能自动增加溢价
✅ **紧急程度调整** - 根据截止日期自动调整价格

## 定价因素

### 1. 任务类别
不同类别的基础价格不同:
- **开发 (development)**: ¥500 - 需求旺盛,价格较高
- **设计 (design)**: ¥400 - 需求较高
- **测试 (testing)**: ¥300 - 需求一般
- **文档 (documentation)**: ¥250 - 需求较低
- **分析 (analysis)**: ¥350 - 需求中等
- **咨询 (consulting)**: ¥600 - 需求旺盛,价格最高

### 2. 复杂度系数 (0.8 - 3.0)
基于以下因素计算:
- **描述长度**: 超过200字 +15%, 超过500字 +30%
- **复杂度关键词**: 算法、优化、架构、集成、分布式、微服务、机器学习、AI、区块链等,每个 +15%
- **技能要求**: TensorFlow、Kubernetes、React等高级技能,每个 +10%
- **信任分要求**: ≥60 +15%, ≥80 +30%

### 3. 市场调整系数 (0.8 - 1.3)
基于最近30天的供需数据:
- **高需求** (平均竞标 ≥5): ×1.3
- **中高需求** (平均竞标 ≥3): ×1.15
- **正常需求** (平均竞标 ≥1.5): ×1.0
- **低需求** (平均竞标 ≥0.5): ×0.9
- **极低需求** (平均竞标 <0.5): ×0.8

### 4. 技能溢价 (1.0 - 1.5)
对高价值技能增加溢价:
- 机器学习、AI、区块链、Kubernetes等
- 每个高价值技能 +10%,最多 +50%

### 5. 紧急程度系数 (1.0 - 1.5)
根据截止日期调整:
- **1天内**: ×1.5
- **3天内**: ×1.3
- **1周内**: ×1.15
- **2周内**: ×1.05
- **更长时间**: ×1.0

## 定价公式

```typescript
adjustedBase = basePrice × complexityMultiplier × marketAdjustment × skillPremium × urgencyMultiplier

minPrice = adjustedBase × 0.8
maxPrice = adjustedBase × 1.2
recommended = (minPrice + maxPrice) / 2
```

## API 端点

### POST /api/v1/tasks/pricing
获取价格建议

**请求体:**
```json
{
  "category": "development",
  "description": "开发一个用户登录系统",
  "requirements": {
    "skills": ["React", "Node.js"],
    "minTrustScore": 60
  },
  "deadline": "2024-01-20"
}
```

**响应:**
```json
{
  "min": 720,
  "max": 1080,
  "recommended": 900,
  "currency": "CNY",
  "breakdown": {
    "basePrice": 500,
    "complexityMultiplier": 1.2,
    "marketAdjustment": 1.15,
    "skillPremium": 1.1,
    "urgencyMultiplier": 1.0
  },
  "factors": {
    "category": "development",
    "estimatedHours": 10,
    "complexity": "medium",
    "marketDemand": "high"
  }
}
```

### GET /api/v1/tasks/pricing/market
获取市场价格参考

**查询参数:**
- `categories`: 可选,指定类别列表(逗号分隔)

**响应:**
```json
[
  {
    "category": "development",
    "avgPrice": 800,
    "minPrice": 400,
    "maxPrice": 1500,
    "demandLevel": "high",
    "sampleSize": 25,
    "trend": "increasing"
  }
]
```

## 前端组件

### PricingTool
完整的定价工具组件,包含:
- 任务类别选择
- 任务描述输入
- 技能要求输入
- 截止日期选择
- 价格建议展示
- 市场价格参考

**使用示例:**
```tsx
import PricingTool from '@/components/PricingTool';

export default function PricingPage() {
  return <PricingTool />;
}
```

## 测试

运行单元测试:
```bash
npm test pricing.service.spec.ts
```

测试覆盖:
- ✅ 价格范围计算
- ✅ 复杂度评估
- ✅ 类别价格差异
- ✅ 技能溢价
- ✅ 紧急程度调整
- ✅ 市场价格计算
- ✅ 历史数据分析

## 文件结构

```
apps/server/src/modules/tasks/
├── pricing.service.ts          # 定价服务
├── pricing.service.spec.ts     # 单元测试
├── tasks.controller.ts         # API端点
├── tasks.module.ts             # 模块定义
└── dto/
    └── index.ts                # DTO定义

apps/web/src/components/PricingTool/
├── PricingTool.tsx             # 定价工具组件
└── index.ts                    # 导出

apps/web/src/app/tasks/pricing/
└── page.tsx                    # 定价页面
```

## 示例场景

### 场景1: 简单开发任务
```
类别: development
描述: 开发一个简单的登录页面
技能: React
截止: 2周后

基础价格: ¥500
复杂度: ×1.0 (简单任务)
市场调整: ×1.15 (需求较高)
技能溢价: ×1.0 (普通技能)
紧急程度: ×1.0 (不紧急)

最终价格: ¥500 × 1.0 × 1.15 × 1.0 × 1.0 = ¥575
价格范围: ¥460 - ¥690
推荐价格: ¥575
```

### 场景2: 复杂AI任务
```
类别: development
描述: 开发一个基于机器学习的推荐系统,需要集成多个微服务,支持高并发
技能: machine learning, tensorflow, kubernetes
截止: 3天内

基础价格: ¥500
复杂度: ×2.1 (包含ML、微服务、高并发关键词)
市场调整: ×1.15 (需求较高)
技能溢价: ×1.2 (ML +10%, TensorFlow +10%)
紧急程度: ×1.3 (3天内)

最终价格: ¥500 × 2.1 × 1.15 × 1.2 × 1.3 = ¥1,884
价格范围: ¥1,507 - ¥2,261
推荐价格: ¥1,884
```

## 未来优化

- [ ] 增加更多定价因素 (地理位置、语言要求等)
- [ ] 机器学习模型优化定价算法
- [ ] 实时市场数据更新
- [ ] 价格历史追踪
- [ ] A/B测试不同定价策略
- [ ] 用户反馈学习

## 许可证

MIT
