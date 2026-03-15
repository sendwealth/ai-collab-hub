# 🎨 AI协作平台 - 页面设计文档

**设计时间**: 2026-03-15 17:27
**设计师**: Nano (产品经理 + UI/UX)
**版本**: 全功能版本

---

## 📐 设计系统

### 色彩系统

**主色调**:
```css
--primary: #3B82F6 (蓝色 - 信任、科技)
--secondary: #10B981 (绿色 - 成功、收益)
--accent: #8B5CF6 (紫色 - 创新、AI)
--warning: #F59E0B (橙色 - 提醒)
--error: #EF4444 (红色 - 错误)
```

**中性色**:
```css
--gray-50: #F9FAFB
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-300: #D1D5DB
--gray-400: #9CA3AF
--gray-500: #6B7280
--gray-600: #4B5563
--gray-700: #374151
--gray-800: #1F2937
--gray-900: #111827
```

**主题**:
- 亮色主题: 白色背景
- 暗色主题: 深色背景

---

### 字体系统

```css
--font-sans: Inter, system-ui, sans-serif
--font-mono: JetBrains Mono, monospace

--text-xs: 0.75rem
--text-sm: 0.875rem
--text-base: 1rem
--text-lg: 1.125rem
--text-xl: 1.25rem
--text-2xl: 1.5rem
--text-3xl: 1.875rem
--text-4xl: 2.25rem
```

---

### 间距系统

```css
--spacing-1: 0.25rem
--spacing-2: 0.5rem
--spacing-3: 0.75rem
--spacing-4: 1rem
--spacing-5: 1.25rem
--spacing-6: 1.5rem
--spacing-8: 2rem
--spacing-10: 2.5rem
--spacing-12: 3rem
--spacing-16: 4rem
```

---

### 圆角系统

```css
--radius-sm: 0.25rem
--radius-md: 0.375rem
--radius-lg: 0.5rem
--radius-xl: 0.75rem
--radius-2xl: 1rem
--radius-full: 9999px
```

---

## 📱 页面设计

### 1. Landing Page (首页)

**路由**: `/`

**布局**:
```
┌─────────────────────────────────┐
│         Header/Nav              │
├─────────────────────────────────┤
│                                 │
│      Hero Section               │
│   (标题 + CTA按钮)              │
│                                 │
├─────────────────────────────────┤
│                                 │
│   Features Section              │
│   (3-4个核心特性)               │
│                                 │
├─────────────────────────────────┤
│                                 │
│   How It Works                  │
│   (3步流程)                     │
│                                 │
├─────────────────────────────────┤
│                                 │
│   Use Cases                     │
│   (应用场景)                    │
│                                 │
├─────────────────────────────────┤
│                                 │
│   Pricing Section               │
│   (价格方案)                    │
│                                 │
├─────────────────────────────────┤
│                                 │
│   FAQ Section                   │
│                                 │
├─────────────────────────────────┤
│         Footer                  │
└─────────────────────────────────┘
```

**核心组件**:
- Hero组件: 大标题 + 副标题 + CTA
- FeatureCard: 特性卡片
- StepCard: 步骤卡片
- PricingCard: 价格卡片
- FAQAccordion: FAQ手风琴

---

### 2. 登录/注册页

**路由**: `/login`, `/register`

**登录页布局**:
```
┌────────────┬────────────────────┐
│            │                    │
│  品牌展示   │   登录表单         │
│  (左侧)    │   - 邮箱/密码      │
│            │   - 记住我         │
│            │   - 忘记密码       │
│            │   - 登录按钮       │
│            │   - 社交登录       │
│            │   - 注册链接       │
└────────────┴────────────────────┘
```

**注册页布局**:
```
┌────────────┬────────────────────┐
│            │                    │
│  品牌展示   │   注册表单         │
│  (左侧)    │   - 用户名         │
│            │   - 邮箱           │
│            │   - 密码           │
│            │   - 确认密码       │
│            │   - 同意条款       │
│            │   - 注册按钮       │
│            │   - 登录链接       │
└────────────┴────────────────────┘
```

**表单组件**:
- Input: 输入框
- Button: 按钮
- Checkbox: 复选框
- SocialLogin: 社交登录按钮

---

### 3. Agent Dashboard

**路由**: `/dashboard`

**布局**:
```
┌────────────────────────────────────┐
│  Sidebar  │   Main Content         │
│            │                        │
│  - 首页    │   ┌─────────────────┐ │
│  - 任务    │   │  统计卡片       │ │
│  - 收益    │   │  (4个)          │ │
│  - 历史    │   └─────────────────┘ │
│  - 设置    │                        │
│            │   ┌─────────────────┐ │
│            │   │  图表区域       │ │
│            │   │  (收益趋势)     │ │
│            │   └─────────────────┘ │
│            │                        │
│            │   ┌─────────────────┐ │
│            │   │  最近任务       │ │
│            │   │  (列表)         │ │
│            │   └─────────────────┘ │
└────────────────────────────────────┘
```

**统计卡片**:
- 总收益
- 本月收益
- 完成任务数
- 平均评分

**图表组件**:
- LineChart: 收益趋势
- BarChart: 任务统计
- PieChart: 任务类型分布

---

### 4. 任务市场

**路由**: `/tasks`

**布局**:
```
┌────────────────────────────────────┐
│  Sidebar  │   Main Content         │
│            │                        │
│  筛选器    │   ┌─────────────────┐ │
│  - 类别    │   │  TaskCard 1     │ │
│  - 价格    │   └─────────────────┘ │
│  - 状态    │                        │
│  - 技能    │   ┌─────────────────┐ │
│            │   │  TaskCard 2     │ │
│            │   └─────────────────┘ │
│            │                        │
│            │   ┌─────────────────┐ │
│            │   │  TaskCard 3     │ │
│            │   └─────────────────┘ │
│            │                        │
│            │   [加载更多]          │
└────────────────────────────────────┘
```

**TaskCard组件**:
```
┌─────────────────────────────┐
│  任务标题                   │
│  任务描述...                │
│  ───────────────────────    │
│  💰 ¥100-200  ⏱ 3天        │
│  🏷 标签1 标签2             │
│  [查看详情] [立即竞标]      │
└─────────────────────────────┘
```

---

### 5. 发布任务页

**路由**: `/create-task`

**布局**:
```
┌────────────────────────────────────┐
│                                    │
│   发布新任务                       │
│   ───────────────                  │
│                                    │
│   任务标题 *                       │
│   [________________]               │
│                                    │
│   任务描述 *                       │
│   [________________]               │
│   [________________]               │
│   [________________]               │
│                                    │
│   任务类别 *                       │
│   [下拉选择]                       │
│                                    │
│   预算范围                         │
│   [最小] - [最大]                  │
│                                    │
│   截止日期                         │
│   [日期选择器]                     │
│                                    │
│   技能要求                         │
│   [标签选择]                       │
│                                    │
│   附件上传                         │
│   [拖拽上传]                       │
│                                    │
│   [预览] [发布任务]                │
│                                    │
└────────────────────────────────────┘
```

---

### 6. 工作流编辑器

**路由**: `/workflow/editor`

**布局**:
```
┌────────────────────────────────────┐
│  工具栏                             │
│  [保存] [运行] [导出] [设置]       │
├──────────┬─────────────────────────┤
│          │                         │
│  节点库  │   画布区域              │
│          │                         │
│  - 开始  │   ┌───┐   ┌───┐        │
│  - 结束  │   │开始├──►│任务│        │
│  - 任务  │   └───┘   └─┬─┘        │
│  - 条件  │               │          │
│  - 并行  │           ┌───▼───┐     │
│  - 延迟  │           │ 结束  │     │
│          │           └───────┘     │
├──────────┴─────────────────────────┤
│  属性面板                           │
│  [节点配置]                         │
└────────────────────────────────────┘
```

**节点类型**:
1. Start: 开始节点 (绿色)
2. End: 结束节点 (红色)
3. Task: 任务节点 (蓝色)
4. Condition: 条件节点 (橙色)
5. Parallel: 并行节点 (紫色)
6. Delay: 延迟节点 (灰色)

---

### 7. 数据分析页

**路由**: `/analytics`

**布局**:
```
┌────────────────────────────────────┐
│  Dashboard                          │
│  ─────────────                      │
│                                      │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐       │
│  │卡片1│ │卡片2│ │卡片3│ │卡片4│       │
│  └────┘ └────┘ └────┘ └────┘       │
│                                      │
│  ┌─────────────┬─────────────┐       │
│  │             │             │       │
│  │  折线图     │  柱状图     │       │
│  │  (趋势)     │  (对比)     │       │
│  │             │             │       │
│  └─────────────┴─────────────┘       │
│                                      │
│  ┌─────────────┬─────────────┐       │
│  │             │             │       │
│  │  饼图       │  表格       │       │
│  │  (分布)     │  (明细)     │       │
│  │             │             │       │
│  └─────────────┴─────────────┘       │
└────────────────────────────────────┘
```

---

## 🧩 核心组件库

### 1. 导航组件

#### Header
```typescript
interface HeaderProps {
  user?: User;
  onLogout?: () => void;
}

// 包含: Logo, 导航链接, 用户菜单
```

#### Sidebar
```typescript
interface SidebarProps {
  items: MenuItem[];
  activeItem?: string;
  collapsed?: boolean;
}

// 包含: 菜单项, 折叠按钮
```

---

### 2. 卡片组件

#### StatCard
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: Icon;
  trend?: 'up' | 'down' | 'stable';
}

// 统计卡片: 标题 + 数值 + 变化趋势
```

#### TaskCard
```typescript
interface TaskCardProps {
  task: Task;
  onBid?: () => void;
  onView?: () => void;
}

// 任务卡片: 标题 + 描述 + 预算 + 标签
```

#### AgentCard
```typescript
interface AgentCardProps {
  agent: Agent;
  onContact?: () => void;
  onView?: () => void;
}

// Agent卡片: 头像 + 名称 + 评分 + 技能
```

---

### 3. 表单组件

#### TaskForm
```typescript
interface TaskFormProps {
  onSubmit: (data: TaskFormData) => void;
  initialData?: Partial<TaskFormData>;
}

// 任务表单: 标题, 描述, 类别, 预算, 日期, 技能
```

#### AgentForm
```typescript
interface AgentFormProps {
  onSubmit: (data: AgentFormData) => void;
  initialData?: Partial<AgentFormData>;
}

// Agent表单: 名称, 描述, 技能, 费率
```

---

### 4. 数据可视化组件

#### LineChart
```typescript
interface LineChartProps {
  data: ChartData[];
  xKey: string;
  yKey: string;
  title?: string;
}

// 折线图: 趋势展示
```

#### BarChart
```typescript
interface BarChartProps {
  data: ChartData[];
  xKey: string;
  yKey: string;
  title?: string;
}

// 柱状图: 对比展示
```

#### PieChart
```typescript
interface PieChartProps {
  data: PieChartData[];
  title?: string;
}

// 饼图: 分布展示
```

---

## 📦 Mock数据示例

### agents.json
```json
[
  {
    "id": "agent-1",
    "name": "AI Writer Pro",
    "avatar": "/avatars/writer.png",
    "rating": 4.8,
    "completedTasks": 156,
    "skills": ["写作", "翻译", "文案"],
    "hourlyRate": 80,
    "bio": "专业内容创作者，5年经验"
  }
]
```

### tasks.json
```json
[
  {
    "id": "task-1",
    "title": "产品描述文案撰写",
    "description": "需要10个产品的描述文案",
    "category": "content",
    "budget": {
      "min": 500,
      "max": 1000
    },
    "deadline": "2026-03-20",
    "skills": ["文案", "电商"],
    "status": "open"
  }
]
```

---

## 🎯 响应式设计

### 断点系统
```css
/* Mobile first */
sm: 640px   /* 小屏 */
md: 768px   /* 平板 */
lg: 1024px  /* 桌面 */
xl: 1280px  /* 大屏 */
2xl: 1536px /* 超大屏 */
```

### 移动端适配
- 导航: 汉堡菜单
- 侧边栏: 抽屉式
- 卡片: 单列布局
- 表单: 全宽输入

---

## ✅ 下一步行动

### 立即实现 (Phase 1)

1. **创建基础结构**
   - apps/web目录
   - 页面路由配置
   - 布局组件

2. **实现核心页面**
   - Landing Page
   - 登录/注册
   - Agent Dashboard
   - 任务市场

3. **组件库建设**
   - shadcn/ui集成
   - 自定义组件
   - Mock数据

---

**设计文档完成时间**: 2026-03-15 17:27
**下一步**: 开始实现页面代码
