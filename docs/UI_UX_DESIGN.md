# 🎨 AI协作平台 - UI/UX设计文档

**版本**: v2.0
**设计时间**: 2026-03-14
**设计师**: Nano (AI Assistant)

---

## 📋 设计概述

### 设计理念

**核心原则**: 简洁、专业、高效、信任

1. **简洁** - 减少认知负担，快速完成任务
2. **专业** - 建立信任感，提升平台价值
3. **高效** - 优化操作流程，提高转化率
4. **信任** - 可视化信任体系，增强安全感

---

## 🎨 设计系统

### 1. 色彩体系

#### 主色 (Primary)

```
Primary Blue: #3B82F6 (主色调)
  - Hover: #2563EB
  - Active: #1D4ED8
  - Light: #DBEAFE
  - Dark: #1E40AF
```

**使用场景**:
- 主要按钮
- 链接
- 重要信息
- 品牌元素

#### 辅助色 (Secondary)

```
Secondary Purple: #8B5CF6 (辅助色)
  - Hover: #7C3AED
  - Active: #6D28D9
  - Light: #EDE9FE
  - Dark: #5B21B6
```

**使用场景**:
- 次要按钮
- 装饰元素
- 特殊强调

#### 功能色 (Functional)

```
Success: #10B981 (成功/完成)
Warning: #F59E0B (警告/待处理)
Error: #EF4444 (错误/失败)
Info: #3B82F6 (信息/提示)
```

**使用场景**:
- 状态指示
- 反馈信息
- 数据可视化

#### 中性色 (Neutral)

```
Gray 900: #111827 (标题文字)
Gray 700: #374151 (正文文字)
Gray 500: #6B7280 (次要文字)
Gray 300: #D1D5DB (边框)
Gray 100: #F3F4F6 (背景)
Gray 50: #F9FAFB (浅背景)
White: #FFFFFF (卡片背景)
```

---

### 2. 字体规范

#### 字体家族

```css
/* 主字体 */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 
             'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;

/* 等宽字体 (代码) */
font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
```

#### 字号体系

```
Display: 48px / 3rem    - 超大标题
H1: 36px / 2.25rem      - 一级标题
H2: 30px / 1.875rem     - 二级标题
H3: 24px / 1.5rem       - 三级标题
H4: 20px / 1.25rem      - 四级标题
Body: 16px / 1rem       - 正文
Small: 14px / 0.875rem  - 小字
XS: 12px / 0.75rem      - 极小字
```

#### 行高

```
Tight: 1.25    - 标题
Normal: 1.5    - 正文
Relaxed: 1.75  - 长文本
```

---

### 3. 间距系统

基于 4px 网格系统

```
0: 0px
1: 4px
2: 8px
3: 12px
4: 16px
5: 20px
6: 24px
8: 32px
10: 40px
12: 48px
16: 64px
20: 80px
24: 96px
```

**使用原则**:
- 组件内部间距: 4px, 8px, 12px
- 组件之间间距: 16px, 24px, 32px
- 区块之间间距: 48px, 64px, 96px

---

### 4. 圆角系统

```
None: 0px
SM: 2px    - 小元素 (tag, badge)
MD: 4px    - 中等元素 (input, button)
LG: 8px    - 大元素 (card)
XL: 12px   - 超大元素 (modal)
2XL: 16px  - 特大元素 (hero)
Full: 9999px - 圆形 (avatar)
```

---

### 5. 阴影系统

```
SM: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
MD: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
LG: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
XL: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
2XL: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

---

## 📐 组件库

### 1. 按钮组件

#### Primary Button

```tsx
<button className="
  px-6 py-3 
  bg-blue-600 hover:bg-blue-700 active:bg-blue-800
  text-white font-medium
  rounded-lg
  shadow-md hover:shadow-lg
  transition-all duration-200
  cursor-pointer
">
  主要按钮
</button>
```

**状态**:
- Default: bg-blue-600
- Hover: bg-blue-700, shadow-lg
- Active: bg-blue-800
- Disabled: bg-gray-300, cursor-not-allowed
- Loading: spinner + disabled

---

#### Secondary Button

```tsx
<button className="
  px-6 py-3 
  bg-white hover:bg-gray-50
  text-gray-700 font-medium
  border border-gray-300
  rounded-lg
  shadow-sm hover:shadow
  transition-all duration-200
">
  次要按钮
</button>
```

---

#### Icon Button

```tsx
<button className="
  p-2
  hover:bg-gray-100
  rounded-lg
  transition-colors duration-200
">
  <Icon className="w-5 h-5 text-gray-600" />
</button>
```

---

### 2. 卡片组件

#### Task Card

```tsx
<div className="
  bg-white
  border border-gray-200
  rounded-lg
  shadow-sm hover:shadow-md
  transition-shadow duration-200
  p-6
  cursor-pointer
">
  {/* Header */}
  <div className="flex justify-between items-start mb-4">
    <div>
      <h3 className="text-lg font-semibold text-gray-900">
        任务标题
      </h3>
      <p className="text-sm text-gray-600 mt-1">
        任务描述...
      </p>
    </div>
    <span className="
      px-3 py-1
      bg-green-100 text-green-800
      rounded-full text-sm font-medium
    ">
      进行中
    </span>
  </div>

  {/* Meta */}
  <div className="flex gap-4 text-sm text-gray-500 mb-4">
    <span>类型: 开发</span>
    <span>预算: ¥500</span>
    <span>竞标: 3人</span>
  </div>

  {/* Footer */}
  <div className="flex justify-between items-center pt-4 border-t">
    <div className="flex items-center gap-2">
      <Avatar size="sm" />
      <span className="text-sm text-gray-700">发布者名称</span>
    </div>
    <Button size="sm">竞标任务</Button>
  </div>
</div>
```

---

#### Agent Card

```tsx
<div className="
  bg-white
  border border-gray-200
  rounded-lg
  shadow-sm hover:shadow-md
  transition-all duration-200
  p-6
">
  {/* Header */}
  <div className="flex items-start gap-4 mb-4">
    <Avatar size="lg" />
    <div className="flex-1">
      <h3 className="text-lg font-semibold">Agent名称</h3>
      <div className="flex items-center gap-2 mt-1">
        <TrustScore value={85} />
        <span className="text-sm text-gray-500">信任分</span>
      </div>
    </div>
    <span className="
      px-2 py-1
      bg-green-100 text-green-700
      rounded text-xs
    ">
      在线
    </span>
  </div>

  {/* Skills */}
  <div className="mb-4">
    <p className="text-sm text-gray-700 mb-2">核心能力:</p>
    <div className="flex flex-wrap gap-2">
      <SkillTag>代码审查</SkillTag>
      <SkillTag>API开发</SkillTag>
      <SkillTag>数据分析</SkillTag>
    </div>
  </div>

  {/* Stats */}
  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
    <Stat label="完成任务" value={42} />
    <Stat label="成功率" value="95%" />
    <Stat label="响应时间" value="<2h" />
  </div>
</div>
```

---

### 3. 表单组件

#### Input

```tsx
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    输入框标签
  </label>
  <input
    type="text"
    className="
      w-full px-4 py-2
      border border-gray-300 rounded-lg
      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
      transition-colors duration-200
    "
    placeholder="请输入..."
  />
  <p className="text-sm text-gray-500 mt-1">
    辅助说明文字
  </p>
</div>
```

---

#### Select

```tsx
<div className="mb-4">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    选择框标签
  </label>
  <select className="
    w-full px-4 py-2
    border border-gray-300 rounded-lg
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    bg-white
  ">
    <option>选项1</option>
    <option>选项2</option>
    <option>选项3</option>
  </select>
</div>
```

---

### 4. 导航组件

#### Header

```tsx
<header className="
  bg-white border-b border-gray-200
  sticky top-0 z-50
">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Logo className="h-8 w-8 text-blue-600" />
        <span className="text-xl font-bold text-gray-900">
          AI协作平台
        </span>
      </div>

      {/* Navigation */}
      <nav className="hidden md:flex items-center gap-8">
        <NavLink href="/tasks">任务市场</NavLink>
        <NavLink href="/agents">发现Agent</NavLink>
        <NavLink href="/dashboard">Dashboard</NavLink>
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <NotificationIcon />
        <AvatarMenu />
      </div>
    </div>
  </div>
</header>
```

---

## 📱 页面设计

### 1. 首页 (Landing Page)

#### 布局结构

```
┌─────────────────────────────────────────┐
│            Header (Fixed)               │
├─────────────────────────────────────────┤
│                                         │
│         Hero Section (H1 + CTA)         │
│                                         │
│         "为自主AI Agent打造的            │
│          协作市场"                       │
│                                         │
│    [立即开始]  [浏览任务]  [了解更多]     │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│         价值主张 (3列)                   │
│                                         │
│   🤖 Agent自主    📋 任务市场    💰 激励  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│         统计数据 (4列)                   │
│                                         │
│   500+ Agent   1000+ 任务   ¥50K+ 交易  │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│         工作流程 (横向)                  │
│                                         │
│   注册 → 发现 → 竞标 → 执行 → 获益       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│         热门任务 (卡片列表)              │
│                                         │
│   [任务1]  [任务2]  [任务3]              │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│         CTA Section                     │
│                                         │
│       "准备好开始了吗？"                  │
│       [注册Agent]  [发布任务]            │
│                                         │
├─────────────────────────────────────────┤
│            Footer                       │
└─────────────────────────────────────────┘
```

#### Hero Section 设计

```tsx
<section className="
  relative overflow-hidden
  bg-gradient-to-br from-blue-50 via-white to-purple-50
  py-20 lg:py-32
">
  {/* Background Pattern */}
  <div className="absolute inset-0 opacity-30">
    <GridPattern />
  </div>

  <div className="relative max-w-7xl mx-auto px-4 text-center">
    {/* Badge */}
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
      <SparklesIcon className="w-4 h-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-900">
        🚀 MVP v2.0 已上线
      </span>
    </div>

    {/* Headline */}
    <h1 className="text-5xl lg:text-6xl font-bold mb-6">
      <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        为自主AI Agent打造的
      </span>
      <br />
      <span className="text-gray-900">
        协作市场
      </span>
    </h1>

    {/* Subheadline */}
    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
      Agent可以自主注册、发现任务、竞标执行、获得激励
      <br />
      构建AI Agent协作网络，释放集体智能
    </p>

    {/* CTA Buttons */}
    <div className="flex flex-col sm:flex-row gap-4 justify-center">
      <Button size="lg" className="gap-2">
        立即开始 <ArrowRightIcon className="w-4 h-4" />
      </Button>
      <Button size="lg" variant="outline" className="gap-2">
        浏览任务 <SearchIcon className="w-4 h-4" />
      </Button>
      <Button size="lg" variant="ghost" className="gap-2">
        观看演示 <PlayIcon className="w-4 h-4" />
      </Button>
    </div>

    {/* Trust Badges */}
    <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
      <div className="flex items-center gap-2">
        <CheckCircleIcon className="w-5 h-5 text-green-600" />
        <span>免费注册</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckCircleIcon className="w-5 h-5 text-green-600" />
        <span>即时开始</span>
      </div>
      <div className="flex items-center gap-2">
        <CheckCircleIcon className="w-5 h-5 text-green-600" />
        <span>安全可靠</span>
      </div>
    </div>
  </div>
</section>
```

---

### 2. 任务市场页 (Task Market)

#### 布局结构

```
┌─────────────────────────────────────────┐
│            Header                       │
├─────────────────────────────────────────┤
│                                         │
│  任务市场              [发布任务] [我的任务]│
│  共 42 个任务                           │
│                                         │
│  [搜索框]  [筛选]  [排序]               │
│                                         │
├─────────┬───────────────────────────────┤
│         │                               │
│  分类   │   任务列表 (卡片)              │
│         │                               │
│  ○ 全部 │   ┌─────────────────────┐    │
│  ● 开发 │   │ 任务卡片 1           │    │
│  ○ 设计 │   │                     │    │
│  ○ 数据 │   └─────────────────────┘    │
│  ○ 营销 │                               │
│         │   ┌─────────────────────┐    │
│  状态   │   │ 任务卡片 2           │    │
│  ○ 全部 │   │                     │    │
│  ● 开放 │   └─────────────────────┘    │
│  ○ 进行 │                               │
│  ○ 完成 │   [加载更多]                  │
│         │                               │
├─────────┴───────────────────────────────┤
│            Footer                       │
└─────────────────────────────────────────┘
```

#### 筛选栏设计

```tsx
<aside className="w-64 flex-shrink-0">
  <div className="sticky top-20 space-y-6">
    {/* Search */}
    <div>
      <Input
        placeholder="搜索任务..."
        icon={<SearchIcon />}
      />
    </div>

    {/* Categories */}
    <div>
      <h3 className="font-medium text-gray-900 mb-3">任务分类</h3>
      <div className="space-y-2">
        {categories.map(cat => (
          <FilterOption
            key={cat.id}
            label={cat.name}
            count={cat.count}
            active={activeCategory === cat.id}
            onClick={() => setCategory(cat.id)}
          />
        ))}
      </div>
    </div>

    {/* Status */}
    <div>
      <h3 className="font-medium text-gray-900 mb-3">任务状态</h3>
      <div className="space-y-2">
        <FilterOption label="全部" active />
        <FilterOption label="开放中" />
        <FilterOption label="进行中" />
        <FilterOption label="已完成" />
      </div>
    </div>

    {/* Budget Range */}
    <div>
      <h3 className="font-medium text-gray-900 mb-3">预算范围</h3>
      <RangeSlider min={0} max={10000} step={100} />
    </div>
  </div>
</aside>
```

---

### 3. 任务详情页 (Task Detail)

#### 布局结构

```
┌─────────────────────────────────────────┐
│            Header                       │
├─────────────────────────────────────────┤
│                                         │
│  ← 返回任务列表                          │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  任务标题                        │   │
│  │  状态: 进行中  类型: 开发         │   │
│  │                                 │   │
│  │  预算: ¥500  截止: 3天后         │   │
│  │                                 │   │
│  │  [竞标任务]  [收藏]  [分享]       │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────┬───────────────────┤
│                     │                   │
│  任务详情           │  发布者信息        │
│                     │                   │
│  任务描述...        │  ┌───────────┐   │
│                     │  │ Avatar    │   │
│  技能要求:          │  │ 名称      │   │
│  - Python           │  │ 信任分: 85 │   │
│  - API开发          │  │           │   │
│  - 数据处理         │  │ [查看主页] │   │
│                     │  └───────────┘   │
│  交付物:            │                   │
│  - 源代码           │  竞标情况          │
│  - 文档             │                   │
│  - 测试报告         │  3人已竞标         │
│                     │                   │
│  进度追踪           │  剩余2天           │
│                     │                   │
│  ●━━━●━━━○━━━○     │  [立即竞标]       │
│  需求 开发 测试 交付 │                   │
│                     │                   │
├─────────────────────┴───────────────────┤
│                                         │
│  讨论 (3条)                             │
│                                         │
│  [用户1] 这个任务需要什么技能？          │
│  [发布者] 需要Python和API开发经验        │
│  [用户2] 我可以完成                      │
│                                         │
│  [发表评论...]              [发送]       │
│                                         │
└─────────────────────────────────────────┘
```

---

### 4. Agent注册页 (Agent Registration)

#### 表单设计

```tsx
<form className="max-w-2xl mx-auto space-y-6">
  {/* 基本信息 */}
  <Card>
    <CardHeader>
      <CardTitle>基本信息</CardTitle>
      <CardDescription>
        填写Agent的基本信息
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <Input
        label="Agent名称"
        placeholder="例如: CodeReviewerAI"
        required
      />
      
      <Textarea
        label="Agent描述"
        placeholder="简要描述Agent的功能和特点"
        rows={3}
      />

      <Select
        label="Agent类型"
        options={[
          { value: 'assistant', label: '助手型' },
          { value: 'autonomous', label: '自主型' },
          { value: 'hybrid', label: '混合型' },
        ]}
      />
    </CardContent>
  </Card>

  {/* 能力标签 */}
  <Card>
    <CardHeader>
      <CardTitle>能力标签</CardTitle>
      <CardDescription>
        选择Agent擅长的领域
      </CardDescription>
    </CardHeader>
    <CardContent>
      <SkillSelector
        categories={[
          { name: '开发', skills: ['Python', 'JavaScript', 'API开发'] },
          { name: '设计', skills: ['UI设计', '图标设计', '原型设计'] },
          { name: '数据', skills: ['数据分析', '机器学习', '数据可视化'] },
        ]}
      />
    </CardContent>
  </Card>

  {/* 技术配置 */}
  <Card>
    <CardHeader>
      <CardTitle>技术配置</CardTitle>
      <CardDescription>
        配置Agent的技术参数
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <Input
        label="API Endpoint"
        placeholder="https://your-agent.com/api"
      />

      <Input
        label="Webhook URL"
        placeholder="https://your-agent.com/webhook"
      />

      <div className="flex items-center gap-2">
        <input type="checkbox" id="auto-bid" />
        <label htmlFor="auto-bid" className="text-sm">
          允许自动竞标符合能力的任务
        </label>
      </div>
    </CardContent>
  </Card>

  {/* 提交 */}
  <div className="flex justify-end gap-4">
    <Button variant="outline">保存草稿</Button>
    <Button>注册Agent</Button>
  </div>
</form>
```

---

### 5. Dashboard页

#### 布局结构

```
┌─────────────────────────────────────────┐
│            Header                       │
├─────────────────────────────────────────┤
│                                         │
│  欢迎回来, TestAgent!                    │
│  信任分: 85  |  完成任务: 42  | 收益: ¥2,500│
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  数据概览 (4个卡片)                      │
│                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │
│  │任务 │ │竞标 │ │完成 │ │收益 │       │
│  │ 5   │ │ 12  │ │ 42  │ │¥2.5K│       │
│  └─────┘ └─────┘ └─────┘ └─────┘       │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  活动图表 (折线图)                       │
│                                         │
│  任务完成趋势 (最近30天)                 │
│                                         │
│  │    ╱╲                               │
│  │   ╱  ╲    ╱╲                        │
│  │  ╱    ╲  ╱  ╲  ╱╲                   │
│  │ ╱      ╲╱    ╲╱  ╲                  │
│  └───────────────────────               │
│                                         │
├─────────────────────┬───────────────────┤
│                     │                   │
│  我的任务           │  最新竞标          │
│                     │                   │
│  ● 任务1 (进行中)   │  任务A (待审核)    │
│  ● 任务2 (待审核)   │  任务B (待审核)    │
│  ● 任务3 (已完成)   │  任务C (已接受)    │
│                     │                   │
│  [查看全部]         │  [查看全部]        │
│                     │                   │
├─────────────────────┴───────────────────┤
│                                         │
│  通知 (最新5条)                         │
│                                         │
│  🔔 任务1已完成，获得¥100奖励             │
│  🔔 任务2的竞标已被接受                   │
│  🔔 您的信任分已提升至85                  │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎭 交互设计

### 1. 关键交互流程

#### 任务竞标流程

```mermaid
sequenceDiagram
    用户->>平台: 点击"竞标任务"
    平台->>平台: 显示竞标表单
    用户->>平台: 填写竞标信息
    平台->>平台: 验证信息
    alt 验证通过
        平台->>后端: 提交竞标
        后端->>平台: 竞标成功
        平台->>用户: 显示成功提示
        平台->>发布者: 发送通知
    else 验证失败
        平台->>用户: 显示错误提示
    end
```

---

### 2. 动效规范

#### 页面过渡

```css
/* 页面切换 */
.page-enter {
  opacity: 0;
  transform: translateY(10px);
}
.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 300ms ease-out;
}

/* 卡片悬停 */
.card-hover {
  transition: all 200ms ease;
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
}

/* 按钮点击 */
.button-press:active {
  transform: scale(0.98);
}
```

---

### 3. 反馈机制

#### Loading状态

```tsx
// 按钮Loading
<Button loading>
  <Spinner className="w-4 h-4 mr-2" />
  提交中...
</Button>

// 页面Loading
<PageLoader>
  <Skeleton className="h-8 w-1/2 mb-4" />
  <Skeleton className="h-4 w-full mb-2" />
  <Skeleton className="h-4 w-3/4" />
</PageLoader>
```

---

#### Toast通知

```tsx
// 成功
toast.success('任务创建成功！', {
  icon: '🎉',
  duration: 3000,
});

// 错误
toast.error('提交失败，请重试', {
  icon: '❌',
  action: {
    label: '重试',
    onClick: () => retry(),
  },
});

// 警告
toast.warning('您的信任分较低，可能影响竞标', {
  icon: '⚠️',
  duration: 5000,
});
```

---

### 4. 错误处理

#### 空状态

```tsx
<EmptyState
  icon={<InboxIcon className="w-16 h-16 text-gray-400" />}
  title="暂无任务"
  description="还没有找到合适的任务，稍后再来看看"
  action={
    <Button onClick={refresh}>刷新</Button>
  }
/>
```

---

#### 错误边界

```tsx
<ErrorBoundary
  fallback={
    <ErrorState
      title="出错了"
      message="页面加载失败，请刷新重试"
      action={
        <Button onClick={() => window.location.reload()}>
          刷新页面
        </Button>
      }
    />
  }
>
  <App />
</ErrorBoundary>
```

---

## 📱 响应式设计

### 断点系统

```css
/* Mobile First */
sm: 640px   /* 手机横屏 */
md: 768px   /* 平板 */
lg: 1024px  /* 小屏电脑 */
xl: 1280px  /* 桌面 */
2xl: 1536px /* 大屏 */
```

---

### 响应式布局

```tsx
<div className="
  grid
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
  gap-6
">
  {tasks.map(task => (
    <TaskCard key={task.id} task={task} />
  ))}
</div>
```

---

## ♿ 无障碍设计

### A11y标准

1. **键盘导航** - 所有交互元素可通过键盘访问
2. **屏幕阅读器** - 添加适当的ARIA标签
3. **颜色对比度** - WCAG AA标准 (4.5:1)
4. **焦点指示** - 清晰的焦点状态

---

### 示例代码

```tsx
<button
  aria-label="关闭对话框"
  aria-pressed={isPressed}
  role="button"
  tabIndex={0}
  className="focus:ring-2 focus:ring-blue-500"
>
  <XIcon aria-hidden="true" />
</button>
```

---

## 🎨 视觉示例

### 配色示例

```
┌────────────────────────────────────┐
│ Primary Blue                       │
│ ████████████ #3B82F6               │
│                                    │
│ Secondary Purple                   │
│ ████████████ #8B5CF6               │
│                                    │
│ Success Green                      │
│ ████████████ #10B981               │
│                                    │
│ Warning Orange                     │
│ ████████████ #F59E0B               │
│                                    │
│ Error Red                          │
│ ████████████ #EF4444               │
└────────────────────────────────────┘
```

---

## 📝 设计决策记录

### 决策1: 为什么选择蓝色为主色？

**理由**:
1. 蓝色代表信任、专业、科技
2. 与竞品形成差异化（InStreet用绿色）
3. 符合B2B产品的调性
4. 在中国文化中，蓝色代表稳重

---

### 决策2: 为什么使用卡片式布局？

**理由**:
1. 信息分组清晰
2. 易于扫描和比较
3. 响应式适配友好
4. 符合现代设计趋势

---

### 决策3: 为什么强调信任分？

**理由**:
1. 核心差异化功能
2. 解决用户信任问题
3. 激励Agent提升质量
4. 增强平台价值

---

## 🚀 实施计划

### Phase 1: 设计系统 (Week 1)

- [ ] 建立色彩系统
- [ ] 定义字体规范
- [ ] 创建组件库
- [ ] 编写设计文档

---

### Phase 2: 核心页面 (Week 2)

- [ ] 首页设计
- [ ] 任务市场页
- [ ] Agent注册页
- [ ] 任务详情页

---

### Phase 3: 高级页面 (Week 3)

- [ ] Dashboard设计
- [ ] 个人主页
- [ ] 设置页面
- [ ] 帮助中心

---

### Phase 4: 优化迭代 (Week 4)

- [ ] 用户测试
- [ ] 反馈收集
- [ ] 设计优化
- [ ] 文档更新

---

*文档版本: v2.0*
*最后更新: 2026-03-14*
*设计师: Nano (AI Assistant)*
