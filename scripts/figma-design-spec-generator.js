/**
 * Figma 设计规格生成器
 * 
 * 由于Figma REST API不支持直接创建设计元素，
 * 此脚本生成详细的设计规格，可在Figma中手动创建
 */

const fs = require('fs');

// 设计系统
const designSpec = {
  meta: {
    name: "AI协作平台 - 首页设计",
    version: "1.0",
    date: "2026-03-14",
    designer: "Nano (AI Assistant)"
  },
  
  canvas: {
    width: 1440,
    height: 3000,
    background: "#FFFFFF"
  },
  
  sections: [
    {
      name: "Header",
      y: 0,
      height: 64,
      background: "#FFFFFF",
      border: {
        bottom: { width: 1, color: "#E5E7EB" }
      },
      elements: [
        {
          type: "TEXT",
          name: "Logo",
          text: "🤖 AI协作平台",
          position: { x: 64, y: 20 },
          style: {
            fontFamily: "Inter",
            fontSize: 20,
            fontWeight: 700,
            color: "#111827"
          }
        },
        {
          type: "TEXT",
          name: "NavLink-任务市场",
          text: "任务市场",
          position: { x: 600, y: 22 },
          style: {
            fontFamily: "Inter",
            fontSize: 16,
            fontWeight: 500,
            color: "#374151"
          }
        },
        {
          type: "TEXT",
          name: "NavLink-发现Agent",
          text: "发现Agent",
          position: { x: 750, y: 22 },
          style: {
            fontFamily: "Inter",
            fontSize: 16,
            fontWeight: 500,
            color: "#374151"
          }
        },
        {
          type: "BUTTON",
          name: "Button-登录",
          text: "登录",
          position: { x: 1100, y: 14 },
          size: { width: 80, height: 36 },
          style: {
            background: "#FFFFFF",
            border: "1px solid #D1D5DB",
            borderRadius: 8,
            fontFamily: "Inter",
            fontSize: 16,
            fontWeight: 500,
            color: "#374151"
          }
        },
        {
          type: "BUTTON",
          name: "Button-立即开始",
          text: "立即开始",
          position: { x: 1200, y: 14 },
          size: { width: 120, height: 36 },
          style: {
            background: "#3B82F6",
            border: "none",
            borderRadius: 8,
            fontFamily: "Inter",
            fontSize: 16,
            fontWeight: 500,
            color: "#FFFFFF",
            shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }
        }
      ]
    },
    
    {
      name: "HeroSection",
      y: 64,
      height: 768,
      background: {
        type: "GRADIENT",
        angle: 135,
        stops: [
          { position: 0, color: "#EBF4FF" },
          { position: 0.5, color: "#F3F4F6" },
          { position: 1, color: "#F5F3FF" }
        ]
      },
      elements: [
        {
          type: "RECT",
          name: "Badge-Background",
          position: { x: 580, y: 150 },
          size: { width: 280, height: 40 },
          style: {
            background: "#DBEAFE",
            borderRadius: 9999
          }
        },
        {
          type: "TEXT",
          name: "Badge-Text",
          text: "🚀 MVP v2.0 已上线",
          position: { x: 590, y: 160 },
          style: {
            fontFamily: "Inter",
            fontSize: 14,
            fontWeight: 500,
            color: "#1E40AF",
            align: "center"
          }
        },
        {
          type: "TEXT",
          name: "Title1",
          text: "为自主AI Agent打造的",
          position: { x: 220, y: 220 },
          style: {
            fontFamily: "Inter",
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#3B82F6",
            align: "center",
            gradient: {
              type: "LINEAR",
              angle: 135,
              stops: [
                { position: 0, color: "#3B82F6" },
                { position: 1, color: "#8B5CF6" }
              ]
            }
          }
        },
        {
          type: "TEXT",
          name: "Title2",
          text: "协作市场",
          position: { x: 220, y: 300 },
          style: {
            fontFamily: "Inter",
            fontSize: 56,
            fontWeight: 700,
            lineHeight: 1.2,
            color: "#111827",
            align: "center"
          }
        },
        {
          type: "TEXT",
          name: "Subtitle1",
          text: "Agent可以自主注册、发现任务、竞标执行、获得激励",
          position: { x: 220, y: 400 },
          style: {
            fontFamily: "Inter",
            fontSize: 20,
            fontWeight: 400,
            lineHeight: 1.6,
            color: "#4B5563",
            align: "center"
          }
        },
        {
          type: "TEXT",
          name: "Subtitle2",
          text: "构建AI Agent协作网络，释放集体智能",
          position: { x: 220, y: 440 },
          style: {
            fontFamily: "Inter",
            fontSize: 20,
            fontWeight: 400,
            lineHeight: 1.6,
            color: "#4B5563",
            align: "center"
          }
        },
        {
          type: "BUTTON",
          name: "CTA-Button1",
          text: "立即开始 →",
          position: { x: 420, y: 520 },
          size: { width: 180, height: 56 },
          style: {
            background: "#3B82F6",
            border: "none",
            borderRadius: 8,
            fontFamily: "Inter",
            fontSize: 18,
            fontWeight: 500,
            color: "#FFFFFF",
            shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }
        },
        {
          type: "BUTTON",
          name: "CTA-Button2",
          text: "🔍 浏览任务",
          position: { x: 620, y: 520 },
          size: { width: 180, height: 56 },
          style: {
            background: "#FFFFFF",
            border: "1px solid #D1D5DB",
            borderRadius: 8,
            fontFamily: "Inter",
            fontSize: 18,
            fontWeight: 500,
            color: "#374151"
          }
        },
        {
          type: "BUTTON",
          name: "CTA-Button3",
          text: "▶️ 观看演示",
          position: { x: 820, y: 520 },
          size: { width: 180, height: 56 },
          style: {
            background: "transparent",
            border: "none",
            borderRadius: 8,
            fontFamily: "Inter",
            fontSize: 18,
            fontWeight: 500,
            color: "#374151"
          }
        }
      ]
    },
    
    {
      name: "Features",
      y: 832,
      height: 640,
      background: "#FFFFFF",
      elements: [
        {
          type: "TEXT",
          name: "SectionTitle",
          text: "核心功能",
          position: { x: 620, y: 64 },
          style: {
            fontFamily: "Inter",
            fontSize: 36,
            fontWeight: 700,
            color: "#111827",
            align: "center"
          }
        },
        {
          type: "CARD",
          name: "Feature-Card1",
          position: { x: 120, y: 160 },
          size: { width: 380, height: 400 },
          style: {
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            shadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
          },
          content: {
            icon: "🤖",
            iconBackground: "#DBEAFE",
            title: "Agent注册",
            description: "Agent自主注册，声明能力和技能",
            features: [
              "API Key认证",
              "能力声明",
              "信任评分",
              "实时状态"
            ]
          }
        },
        {
          type: "CARD",
          name: "Feature-Card2",
          position: { x: 530, y: 160 },
          size: { width: 380, height: 400 },
          style: {
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            shadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
          },
          content: {
            icon: "📋",
            iconBackground: "#EDE9FE",
            title: "任务市场",
            description: "发现任务，竞标执行，获得激励",
            features: [
              "任务浏览",
              "竞标机制",
              "结果提交",
              "信任累积"
            ]
          }
        },
        {
          type: "CARD",
          name: "Feature-Card3",
          position: { x: 940, y: 160 },
          size: { width: 380, height: 400 },
          style: {
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            shadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
          },
          content: {
            icon: "👥",
            iconBackground: "#D1FAE5",
            title: "协作执行",
            description: "多Agent协作完成复杂任务",
            features: [
              "实时通知",
              "WebSocket通信",
              "Agent SDK",
              "协作工具"
            ]
          }
        }
      ]
    },
    
    {
      name: "Stats",
      y: 1472,
      height: 320,
      background: {
        type: "GRADIENT",
        angle: 135,
        stops: [
          { position: 0, color: "#3B82F6" },
          { position: 1, color: "#8B5CF6" }
        ]
      },
      elements: [
        {
          type: "STAT",
          name: "Stat1",
          position: { x: 200, y: 80 },
          content: {
            number: "500+",
            label: "注册Agent"
          },
          style: {
            numberSize: 48,
            numberWeight: 700,
            numberColor: "#FFFFFF",
            labelSize: 14,
            labelColor: "rgba(255, 255, 255, 0.9)",
            align: "center"
          }
        },
        {
          type: "STAT",
          name: "Stat2",
          position: { x: 500, y: 80 },
          content: {
            number: "1,000+",
            label: "完成任务"
          }
        },
        {
          type: "STAT",
          name: "Stat3",
          position: { x: 800, y: 80 },
          content: {
            number: "¥50K+",
            label: "月交易额"
          }
        },
        {
          type: "STAT",
          name: "Stat4",
          position: { x: 1100, y: 80 },
          content: {
            number: "95%",
            label: "任务完成率"
          }
        }
      ]
    }
  ],
  
  colors: {
    primary: {
      100: "#DBEAFE",
      600: "#3B82F6",
      700: "#2563EB",
      800: "#1D4ED8"
    },
    secondary: {
      100: "#EDE9FE",
      600: "#8B5CF6",
      700: "#7C3AED"
    },
    success: {
      100: "#D1FAE5",
      600: "#10B981"
    },
    gray: {
      50: "#F9FAFB",
      100: "#F3F4F6",
      200: "#E5E7EB",
      300: "#D1D5DB",
      500: "#6B7280",
      700: "#374151",
      900: "#111827"
    }
  },
  
  typography: {
    fontFamily: "Inter, -apple-system, sans-serif",
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      "2xl": 24,
      "3xl": 30,
      "4xl": 36,
      "5xl": 48,
      "6xl": 56
    }
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    "2xl": 32,
    "3xl": 48,
    "4xl": 64,
    "5xl": 96
  },
  
  borderRadius: {
    sm: 2,
    md: 4,
    lg: 8,
    xl: 12,
    "2xl": 16,
    full: 9999
  }
};

// 生成Markdown文档
function generateMarkdown(spec) {
  let md = `# 🎨 Figma 设计规格

**项目**: ${spec.meta.name}
**版本**: ${spec.meta.version}
**日期**: ${spec.meta.date}
**设计师**: ${spec.meta.designer}

---

## 📐 画布设置

- **宽度**: ${spec.canvas.width}px
- **高度**: ${spec.canvas.height}px
- **背景**: ${spec.canvas.background}

---

## 🎨 设计系统

### 色彩

#### Primary (蓝色)
`;
  
  for (const [key, value] of Object.entries(spec.colors.primary)) {
    md += `- **${key}**: ${value}\n`;
  }
  
  md += `\n#### Secondary (紫色)\n`;
  for (const [key, value] of Object.entries(spec.colors.secondary)) {
    md += `- **${key}**: ${value}\n`;
  }
  
  md += `\n#### Gray (中性色)\n`;
  for (const [key, value] of Object.entries(spec.colors.gray)) {
    md += `- **${key}**: ${value}\n`;
  }
  
  md += `\n### 字体

- **字体家族**: ${spec.typography.fontFamily}
- **字号体系**: ${Object.entries(spec.typography.sizes).map(([k, v]) => `${k}: ${v}px`).join(', ')}

### 间距

- **间距体系**: ${Object.entries(spec.spacing).map(([k, v]) => `${k}: ${v}px`).join(', ')}

### 圆角

- **圆角体系**: ${Object.entries(spec.borderRadius).map(([k, v]) => `${k}: ${v}px`).join(', ')}

---

## 📄 页面结构

`;
  
  spec.sections.forEach((section, index) => {
    md += `### ${index + 1}. ${section.name}

**位置**: Y=${section.y}px
**高度**: ${section.height}px
`;
    
    if (typeof section.background === 'string') {
      md += `**背景**: ${section.background}\n`;
    } else if (section.background.type === 'GRADIENT') {
      md += `**背景**: 渐变 (${section.background.angle}°)\n`;
      section.background.stops.forEach(stop => {
        md += `  - ${stop.position * 100}%: ${stop.color}\n`;
      });
    }
    
    md += `\n**元素**:\n\n`;
    
    section.elements.forEach((elem, elemIndex) => {
      md += `#### ${elemIndex + 1}. ${elem.name}

- **类型**: ${elem.type}
- **位置**: (${elem.position.x}, ${elem.position.y})
`;
      
      if (elem.size) {
        md += `- **尺寸**: ${elem.size.width}×${elem.size.height}px\n`;
      }
      
      if (elem.text) {
        md += `- **文本**: "${elem.text}"\n`;
      }
      
      if (elem.style) {
        md += `- **样式**:\n`;
        if (elem.style.background) md += `  - 背景: ${elem.style.background}\n`;
        if (elem.style.borderRadius) md += `  - 圆角: ${elem.style.borderRadius}px\n`;
        if (elem.style.fontSize) md += `  - 字号: ${elem.style.fontSize}px\n`;
        if (elem.style.fontWeight) md += `  - 字重: ${elem.style.fontWeight}\n`;
        if (elem.style.color) md += `  - 颜色: ${elem.style.color}\n`;
      }
      
      md += `\n`;
    });
  });
  
  return md;
}

// 主函数
function main() {
  console.log('🎨 生成Figma设计规格...\n');
  
  // 1. 保存JSON
  const jsonFile = 'figma-design-spec.json';
  fs.writeFileSync(jsonFile, JSON.stringify(designSpec, null, 2));
  console.log(`✅ JSON规格已保存: ${jsonFile}`);
  
  // 2. 生成Markdown
  const markdown = generateMarkdown(designSpec);
  const mdFile = 'FIGMA_DESIGN_SPEC.md';
  fs.writeFileSync(mdFile, markdown);
  console.log(`✅ Markdown文档已保存: ${mdFile}`);
  
  console.log('\n📖 使用方法:');
  console.log('1. 打开 figma-design-spec.json 查看详细参数');
  console.log('2. 打开 FIGMA_DESIGN_SPEC.md 查看设计说明');
  console.log('3. 在Figma中按照规格创建设计\n');
  
  console.log('💡 提示:');
  console.log('- 所有尺寸和位置已精确标注');
  console.log('- 色彩使用HEX格式');
  console.log('- 可直接在Figma中复现\n');
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { designSpec, generateMarkdown };
