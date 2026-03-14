# 🎨 Figma 设计指南

**项目**: AI协作平台
**版本**: v1.0
**设计师**: Nano (AI Assistant)

---

## 📋 概述

本文档为Figma设计师提供完整的设计指南，包括设计系统、页面规范和组件库。

---

## 🎨 设计系统

### 1. 色彩系统

#### Primary (蓝色 - 信任、专业)

```
Primary-600: #3B82F6 (主色调)
Primary-700: #2563EB (Hover)
Primary-800: #1D4ED8 (Active)
Primary-100: #DBEAFE (背景)
```

**使用场景**:
- 主要按钮
- 链接
- 品牌元素
- 重要信息

---

#### Secondary (紫色 - 创新、科技)

```
Secondary-600: #8B5CF6
Secondary-700: #7C3AED
Secondary-800: #6D28D9
Secondary-100: #EDE9FE
```

**使用场景**:
- 次要按钮
- 装饰元素
- 渐变组合

---

#### Functional (功能色)

```
Success: #10B981 (成功/完成)
Warning: #F59E0B (警告/待处理)
Error: #EF4444 (错误/失败)
Info: #3B82F6 (信息/提示)
```

---

### 2. 字体系统

#### 字体家族

**中文**:
- Primary: PingFang SC
- Fallback: Microsoft YaHei

**英文**:
- Primary: SF Pro
- Fallback: Segoe UI

**代码**:
- Primary: SF Mono
- Fallback: Fira Code

---

#### 字号体系

```
Display: 56px / 3.5rem (超大标题)
H1: 36px / 2.25rem (一级标题)
H2: 30px / 1.875rem (二级标题)
H3: 24px / 1.5rem (三级标题)
H4: 20px / 1.25rem (四级标题)
Body: 16px / 1rem (正文)
Small: 14px / 0.875rem (小字)
XS: 12px / 0.75rem (极小字)
```

---

#### 字重

```
Regular: 400
Medium: 500
Semibold: 600
Bold: 700
```

---

### 3. 间距系统

基于 **8px 网格**

```
4px   - 极小间距
8px   - 小间距
12px  - 中小间距
16px  - 中等间距 (组件内)
24px  - 大间距 (组件间)
32px  - 超大间距 (区块间)
48px  - 区块间距
64px  - 大区块间距
96px  - 超大区块间距
```

---

### 4. 圆角系统

```
None: 0px
SM: 2px (tag, badge)
MD: 4px (input, button)
LG: 8px (card)
XL: 12px (modal)
2XL: 16px (hero)
Full: 9999px (avatar, pill button)
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

### 1. Button

#### Primary Button

**尺寸**:
- Small: padding: 8px 16px, font: 14px
- Medium: padding: 12px 24px, font: 16px
- Large: padding: 16px 32px, font: 18px

**状态**:
- Default: bg-blue-600
- Hover: bg-blue-700, shadow-lg
- Active: bg-blue-800
- Disabled: bg-gray-300, cursor-not-allowed

**Figma Properties**:
```
Background: Primary-600
Border Radius: 8px
Padding: 12px 24px
Shadow: MD
Text: White, Medium, 16px
```

---

#### Secondary Button

**Figma Properties**:
```
Background: White
Border: 1px Gray-300
Border Radius: 8px
Padding: 12px 24px
Shadow: SM
Text: Gray-700, Medium, 16px
```

---

### 2. Card

#### Task Card

**尺寸**: 360px × auto

**结构**:
```
┌─────────────────────────────────┐
│  Header (标题 + 状态)            │  padding: 24px
│  Meta (类型/预算/竞标)           │  padding: 0 24px
│  Footer (发布者 + 按钮)          │  padding: 16px 24px
│  border-top: 1px                │
└─────────────────────────────────┘
```

**Figma Properties**:
```
Background: White
Border: 1px Gray-200
Border Radius: 12px
Shadow: SM (Hover: LG)
Padding: 24px
```

---

### 3. Input

**尺寸**: Full width

**Figma Properties**:
```
Background: White
Border: 1px Gray-300
Border Radius: 8px
Padding: 12px 16px
Text: Gray-900, Regular, 16px
Placeholder: Gray-400
Focus Border: 2px Primary-500
```

---

## 📱 页面规范

### 1. 首页 (Landing Page)

#### 布局

```
┌─────────────────────────────────┐
│  Header (64px, sticky)          │
├─────────────────────────────────┤
│  Hero Section (768px)           │
│  - Badge                        │
│  - H1 Title                     │
│  - Subtitle                     │
│  - CTA Buttons                  │
│  - Trust Badges                 │
├─────────────────────────────────┤
│  Features (640px)               │
│  - Section Title                │
│  - 3 Cards Grid                 │
├─────────────────────────────────┤
│  Stats (320px)                  │
│  - Gradient Background          │
│  - 4 Stats                      │
├─────────────────────────────────┤
│  How It Works (480px)           │
│  - Section Title                │
│  - 4 Steps                      │
├─────────────────────────────────┤
│  CTA Section (384px)            │
│  - Card                         │
│  - Buttons                      │
├─────────────────────────────────┤
│  Footer (160px)                 │
└─────────────────────────────────┘
```

---

#### Hero Section

**尺寸**: 768px height

**背景**: 
- Gradient: linear-gradient(135deg, #EBF4FF 0%, #F3F4F6 50%, #F5F3FF 100%)
- Grid Pattern: opacity 30%

**内容**:
```
Badge
  - Background: Primary-100
  - Border Radius: 9999px
  - Padding: 8px 16px
  - Text: Primary-800, Medium, 14px

H1 Title
  - Font Size: 56px
  - Font Weight: Bold
  - Line Height: 1.2
  - Text: Gradient (Primary-600 to Secondary-600)

Subtitle
  - Font Size: 20px
  - Color: Gray-600
  - Line Height: 1.6

CTA Buttons
  - Gap: 16px
  - Buttons: Primary + Secondary + Ghost
```

---

### 2. 任务市场页

#### 布局

```
┌─────────────────────────────────┐
│  Header (64px)                  │
├─────────────────────────────────┤
│  Page Header (120px)            │
│  - Title + Description          │
│  - Search + Filters             │
├──────┬──────────────────────────┤
│      │                          │
│ 筛选 │  任务列表                 │
│ 侧栏 │  (3列网格)                │
│      │                          │
│ 240px│  Main Content            │
│      │                          │
└──────┴──────────────────────────┘
```

---

#### 筛选侧栏

**宽度**: 240px

**内容**:
```
Search Input
  - Margin Bottom: 24px

Category Section
  - Title: Gray-900, Medium, 14px
  - Options: Gray-600, 14px
  - Active: Primary-600

Status Section
  - Similar to Category

Budget Range
  - Slider Component
```

---

### 3. Dashboard页

#### 布局

```
┌─────────────────────────────────┐
│  Header (64px)                  │
├─────────────────────────────────┤
│  Welcome Banner (120px)         │
│  - User Info                    │
│  - Quick Stats                  │
├─────────────────────────────────┤
│  Stats Cards (160px)            │
│  - 4 Cards Grid                 │
├─────────────────────────────────┤
│  Activity Chart (320px)         │
│  - Line Chart                   │
├──────────┬──────────────────────┤
│ My Tasks │ Latest Bids          │
│ (50%)    │ (50%)                │
├──────────┴──────────────────────┤
│  Notifications (240px)          │
│  - List of Notifications        │
└─────────────────────────────────┘
```

---

## 🎭 交互设计

### 1. Hover Effects

**Button Hover**:
```
- Background: Darken 10%
- Shadow: Increase (MD → LG)
- Transform: translateY(-1px)
- Transition: 200ms
```

**Card Hover**:
```
- Shadow: SM → LG
- Border Color: Gray-200 → Primary-600
- Transform: translateY(-4px)
- Transition: 300ms
```

---

### 2. Focus States

**Input Focus**:
```
- Border: 2px Primary-500
- Ring: 0 0 0 3px Primary-100
- Outline: None
```

**Button Focus**:
```
- Ring: 0 0 0 3px Primary-100
- Outline: None
```

---

### 3. Loading States

**Button Loading**:
```
- Spinner Icon (left)
- Text: "Loading..."
- Disabled state
```

**Page Loading**:
```
- Skeleton Screen
- Pulse Animation
```

---

## 📐 栅格系统

### Container

```
Max Width: 1280px
Padding: 24px (mobile: 16px)
Margin: 0 auto
```

---

### Grid

```
Columns: 12
Gutter: 24px (mobile: 16px)
```

**Responsive Breakpoints**:
```
Mobile: 1 column
Tablet (md): 2 columns
Desktop (lg): 3-4 columns
```

---

## 📱 响应式设计

### Breakpoints

```
sm: 640px (手机横屏)
md: 768px (平板)
lg: 1024px (小屏电脑)
xl: 1280px (桌面)
2xl: 1536px (大屏)
```

---

### 响应式规则

**Typography**:
```
Mobile: H1 = 36px
Desktop: H1 = 56px
```

**Spacing**:
```
Mobile: Section = 64px
Desktop: Section = 96px
```

**Grid**:
```
Mobile: 1 column
Tablet: 2 columns
Desktop: 3-4 columns
```

---

## ✅ Figma 文件结构

### 建议的文件组织

```
AI Collab Platform
├── 📁 Cover
│   └── Cover Page
├── 📁 Design System
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Components
│   └── Icons
├── 📁 Components
│   ├── Buttons
│   ├── Cards
│   ├── Inputs
│   ├── Navigation
│   └── Feedback
├── 📁 Pages
│   ├── Homepage
│   ├── Task Market
│   ├── Task Detail
│   ├── Agent Profile
│   ├── Dashboard
│   └── Settings
└── 📁 Prototypes
    ├── Desktop
    └── Mobile
```

---

## 🎨 设计交付

### 交付清单

**设计系统**:
- [ ] 色彩系统 (Color Styles)
- [ ] 字体系统 (Text Styles)
- [ ] 间距系统 (Grid & Layout)
- [ ] 组件库 (Components)

**页面设计**:
- [ ] 首页 (Desktop + Mobile)
- [ ] 任务市场 (Desktop + Mobile)
- [ ] 任务详情 (Desktop + Mobile)
- [ ] Agent主页 (Desktop + Mobile)
- [ ] Dashboard (Desktop + Mobile)

**交互原型**:
- [ ] 关键流程原型
- [ ] Hover/Active/Focus状态
- [ ] Loading状态
- [ ] Error状态

**设计规范**:
- [ ] 组件使用说明
- [ ] 间距规范
- [ ] 响应式规则
- [ ] 动效规范

---

## 📝 设计资源

### 已提供的资源

1. **HTML原型** (可运行)
   - 位置: `design-prototypes/homepage-v1.html`
   - 用途: 查看实际效果

2. **设计Token** (JSON)
   - 位置: `design-prototypes/design-tokens.json`
   - 用途: 导入Figma Variables

3. **设计文档** (Markdown)
   - 产品设计: `docs/PRODUCT_DESIGN.md`
   - UI/UX设计: `docs/UI_UX_DESIGN.md`
   - Figma指南: `docs/FIGMA_GUIDE.md` (本文档)

---

### Figma 插件推荐

1. **Figma Tokens** - 导入设计Token
2. **Content Reel** - 快速填充内容
3. **Unsplash** - 图片素材
4. **Iconify** - 图标库
5. **Autoflow** - 流程图

---

## 🚀 开始设计

### 步骤1: 创建设计系统

1. 创建新的Figma文件
2. 设置颜色变量 (Color Variables)
3. 设置字体样式 (Text Styles)
4. 创建栅格系统 (Grid)
5. 创建基础组件 (Components)

---

### 步骤2: 设计首页

1. 创建桌面版 (1440px)
2. 创建移动版 (375px)
3. 添加交互原型
4. 标注尺寸和间距

---

### 步骤3: 设计其他页面

按照同样的流程设计:
- 任务市场
- 任务详情
- Agent主页
- Dashboard

---

## 📞 联系方式

如有疑问，请参考:
- 产品设计文档: `docs/PRODUCT_DESIGN.md`
- UI/UX设计文档: `docs/UI_UX_DESIGN.md`
- GitHub: https://github.com/sendwealth/ai-collab-hub

---

*文档版本: v1.0*
*创建时间: 2026-03-14*
*设计师: Nano (AI Assistant)*
