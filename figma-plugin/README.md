# Figma 插件使用指南

## 📦 插件信息

**插件名称**: AI协作平台设计生成器
**版本**: 1.0.0
**功能**: 自动生成完整的首页设计

---

## 🚀 安装步骤

### 方法1: 开发模式（推荐）

1. **打开Figma桌面应用**

2. **进入插件开发模式**
   ```
   菜单: Plugins → Development → New Plugin...
   ```

3. **创建新插件**
   - Name: `AI协作平台设计生成器`
   - Template: `Figma Design`
   - Save to: 选择一个文件夹

4. **复制插件文件**
   
   将以下文件复制到插件文件夹：
   - `manifest.json`
   - `code.js`
   - `ui.html`

5. **运行插件**
   ```
   菜单: Plugins → Development → AI协作平台设计生成器
   ```

---

### 方法2: 打包安装

1. **打包插件**
   ```bash
   cd figma-plugin
   zip -r ai-collab-plugin.zip *
   ```

2. **在Figma中导入**
   ```
   菜单: Plugins → Development → Import plugin from file...
   选择: ai-collab-plugin.zip
   ```

---

## 📖 使用步骤

### 1. 打开Figma文件

打开您的Figma设计文件（或创建新文件）

### 2. 运行插件

```
菜单: Plugins → Development → AI协作平台设计生成器
```

### 3. 点击"生成设计"

插件将自动创建：
- ✅ Header (64px)
- ✅ Hero Section (768px)
- ✅ Features (640px)
- ✅ Stats (320px)

### 4. 查看结果

设计将自动创建在当前页面，视口会自动滚动到设计位置。

---

## 🎨 设计规格

### 画布

- **宽度**: 1440px
- **高度**: 2000px
- **背景**: #FFFFFF

### 色彩

- **Primary**: #3B82F6 (蓝色)
- **Secondary**: #8B5CF6 (紫色)
- **Success**: #10B981 (绿色)
- **Gray**: #F9FAFB → #111827 (9个层级)

### 字体

- **字体**: Inter
- **字号**: 12px - 56px

### 组件

1. **Header**
   - Logo + 导航 + 按钮
   - 5个元素

2. **Hero Section**
   - Badge + 标题 + 副标题 + CTA
   - 9个元素

3. **Features**
   - 3个功能卡片
   - 每个卡片包含图标、标题、描述

4. **Stats**
   - 4个统计数据
   - 渐变背景

---

## ⚙️ 自定义

### 修改色彩

编辑 `code.js` 中的 `designSystem.colors`:

```javascript
colors: {
  primary: { r: 59/255, g: 130/255, b: 246/255, a: 1 },
  // ... 修改RGB值
}
```

### 修改字体

编辑 `code.js` 中的 `designSystem.fonts`:

```javascript
fonts: {
  family: 'Inter', // 修改字体
  sizes: {
    '6xl': 56 // 修改字号
  }
}
```

### 修改布局

编辑 `code.js` 中的位置参数：

```javascript
const logo = createText('🤖 AI协作平台', 64, 20, ...);
//                                     ↑   ↑
//                                     x   y
```

---

## 🐛 故障排除

### 问题1: 插件无法运行

**解决方案**:
- 确保使用Figma桌面应用
- 确保已启用开发模式
- 检查manifest.json格式是否正确

### 问题2: 字体找不到

**解决方案**:
- 确保Inter字体已安装
- 或修改为其他已安装的字体

### 问题3: 设计位置不对

**解决方案**:
- 检查Figma文件缩放比例
- 尝试重置视口（Cmd+0 / Ctrl+0）

---

## 📚 扩展功能

### 添加新页面

在 `code.js` 中添加新函数：

```javascript
function createTaskMarket() {
  // 创建任务市场页面
  const frame = createFrame('TaskMarket', 0, 0, 1440, 2000, ...);
  // ... 添加元素
  return frame;
}
```

### 添加新组件

在 `code.js` 中添加新函数：

```javascript
function createCard(x, y, title, description) {
  const card = createFrame('Card', x, y, 380, 200, ...);
  // ... 添加元素
  return card;
}
```

---

## 📞 支持

如有问题，请查看：
- GitHub: https://github.com/sendwealth/ai-collab-hub
- 设计文档: docs/UI_UX_DESIGN.md
- 设计规格: scripts/figma-design-spec.json

---

*插件版本: 1.0.0*
*创建时间: 2026-03-14*
