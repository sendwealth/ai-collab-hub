/**
 * AI协作平台 - Figma插件
 * 
 * 功能：自动生成完整的首页设计
 */

// 设计系统
const designSystem = {
  colors: {
    primary: { r: 59/255, g: 130/255, b: 246/255, a: 1 }, // #3B82F6
    primary700: { r: 37/255, g: 99/255, b: 235/255, a: 1 }, // #2563EB
    primary800: { r: 29/255, g: 78/255, b: 216/255, a: 1 }, // #1D4ED8
    primary100: { r: 219/255, g: 234/255, b: 254/255, a: 1 }, // #DBEAFE
    
    secondary: { r: 139/255, g: 92/255, b: 246/255, a: 1 }, // #8B5CF6
    secondary100: { r: 237/255, g: 233/255, b: 254/255, a: 1 }, // #EDE9FE
    
    success: { r: 16/255, g: 185/255, b: 129/255, a: 1 }, // #10B981
    success100: { r: 209/255, g: 250/255, b: 229/255, a: 1 }, // #D1FAE5
    
    gray: {
      50: { r: 249/255, g: 250/255, b: 251/255, a: 1 },
      100: { r: 243/255, g: 244/255, b: 246/255, a: 1 },
      200: { r: 229/255, g: 231/255, b: 235/255, a: 1 },
      300: { r: 209/255, g: 213/255, b: 219/255, a: 1 },
      500: { r: 107/255, g: 114/255, b: 128/255, a: 1 },
      600: { r: 75/255, g: 85/255, b: 99/255, a: 1 },
      700: { r: 55/255, g: 65/255, b: 81/255, a: 1 },
      900: { r: 17/255, g: 24/255, b: 39/255, a: 1 }
    },
    
    white: { r: 1, g: 1, b: 1, a: 1 },
    transparent: { r: 1, g: 1, b: 1, a: 0 }
  },
  
  fonts: {
    family: 'Inter',
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
      '6xl': 56
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  }
};

// 创建Frame
function createFrame(name, x, y, width, height, fills) {
  const frame = figma.createFrame();
  frame.name = name;
  frame.x = x;
  frame.y = y;
  frame.resize(width, height);
  if (fills) {
    frame.fills = fills;
  }
  return frame;
}

// 创建文本
function createText(text, x, y, fontSize, fontWeight, color, textAlign = 'LEFT') {
  const textNode = figma.createText();
  textNode.characters = text;
  textNode.x = x;
  textNode.y = y;
  textNode.fontSize = fontSize;
  textNode.fontName = { family: designSystem.fonts.family, style: fontWeight >= 700 ? 'Bold' : fontWeight >= 600 ? 'SemiBold' : fontWeight >= 500 ? 'Medium' : 'Regular' };
  textNode.fontWeight = fontWeight;
  textNode.fills = [{ type: 'SOLID', color }];
  textNode.textAlignHorizontal = textAlign;
  return textNode;
}

// 创建矩形
function createRect(name, x, y, width, height, fills, cornerRadius = 0) {
  const rect = figma.createRectangle();
  rect.name = name;
  rect.x = x;
  rect.y = y;
  rect.resize(width, height);
  rect.fills = fills;
  rect.cornerRadius = cornerRadius;
  return rect;
}

// 创建按钮
function createButton(text, x, y, width, height, variant = 'primary') {
  const button = createFrame(`Button/${variant}`, x, y, width, height);
  
  if (variant === 'primary') {
    button.fills = [{ type: 'SOLID', color: designSystem.colors.primary }];
  } else if (variant === 'secondary') {
    button.fills = [{ type: 'SOLID', color: designSystem.colors.white }];
    button.strokes = [{ type: 'SOLID', color: designSystem.colors.gray[300] }];
    button.strokeWeight = 1;
  } else if (variant === 'ghost') {
    button.fills = [{ type: 'SOLID', color: designSystem.colors.transparent }];
  }
  
  button.cornerRadius = 8;
  
  const buttonText = createText(
    text,
    0, 0,
    designSystem.fonts.sizes.base,
    designSystem.fonts.weights.medium,
    variant === 'primary' ? designSystem.colors.white : designSystem.colors.gray[700],
    'CENTER'
  );
  
  // 居中文本
  buttonText.x = (width - buttonText.width) / 2;
  buttonText.y = (height - buttonText.height) / 2;
  
  button.appendChild(buttonText);
  
  return button;
}

// 创建首页设计
function createHomepage() {
  // 1. 创建主Frame
  const mainFrame = createFrame('Homepage', 0, 0, 1440, 2000, [{ type: 'SOLID', color: designSystem.colors.white }]);
  
  // 2. Header
  const header = createFrame('Header', 0, 0, 1440, 64, [{ type: 'SOLID', color: designSystem.colors.white }]);
  header.strokes = [{ type: 'SOLID', color: designSystem.colors.gray[200] }];
  header.strokeWeight = 1;
  header.strokeAlign = 'INSIDE';
  
  // Logo
  const logo = createText('🤖 AI协作平台', 64, 20, 20, 700, designSystem.colors.gray[900]);
  header.appendChild(logo);
  
  // Navigation
  const nav1 = createText('任务市场', 600, 22, 16, 500, designSystem.colors.gray[700]);
  header.appendChild(nav1);
  
  const nav2 = createText('发现Agent', 750, 22, 16, 500, designSystem.colors.gray[700]);
  header.appendChild(nav2);
  
  const nav3 = createText('Dashboard', 880, 22, 16, 500, designSystem.colors.gray[700]);
  header.appendChild(nav3);
  
  const nav4 = createText('文档', 990, 22, 16, 500, designSystem.colors.gray[700]);
  header.appendChild(nav4);
  
  // Buttons
  const loginBtn = createButton('登录', 1100, 14, 80, 36, 'secondary');
  header.appendChild(loginBtn);
  
  const startBtn = createButton('立即开始', 1200, 14, 120, 36, 'primary');
  header.appendChild(startBtn);
  
  mainFrame.appendChild(header);
  
  // 3. Hero Section
  const hero = createFrame('HeroSection', 0, 64, 1440, 768, [
    {
      type: 'GRADIENT_LINEAR',
      gradientHandlePositions: [0, 0, 1, 0],
      gradientStops: [
        { position: 0, color: { r: 235/255, g: 244/255, b: 255/255, a: 1 } },
        { position: 0.5, color: { r: 243/255, g: 244/255, b: 246/255, a: 1 } },
        { position: 1, color: { r: 245/255, g: 243/255, b: 255/255, a: 1 } }
      ]
    }
  ]);
  
  // Badge
  const badgeBg = createRect('Badge-Bg', 580, 150, 280, 40, [{ type: 'SOLID', color: designSystem.colors.primary100 }], 9999);
  hero.appendChild(badgeBg);
  
  const badgeText = createText('🚀 MVP v2.0 已上线', 590, 160, 14, 500, designSystem.colors.primary800, 'CENTER');
  badgeText.resize(260, 20);
  hero.appendChild(badgeText);
  
  // Title
  const title1 = createText('为自主AI Agent打造的', 220, 220, 56, 700, designSystem.colors.primary, 'CENTER');
  title1.resize(1000, 67);
  hero.appendChild(title1);
  
  const title2 = createText('协作市场', 220, 300, 56, 700, designSystem.colors.gray[900], 'CENTER');
  title2.resize(1000, 67);
  hero.appendChild(title2);
  
  // Subtitle
  const subtitle1 = createText('Agent可以自主注册、发现任务、竞标执行、获得激励', 220, 400, 20, 400, designSystem.colors.gray[600], 'CENTER');
  subtitle1.resize(1000, 30);
  hero.appendChild(subtitle1);
  
  const subtitle2 = createText('构建AI Agent协作网络，释放集体智能', 220, 440, 20, 400, designSystem.colors.gray[600], 'CENTER');
  subtitle2.resize(1000, 30);
  hero.appendChild(subtitle2);
  
  // CTA Buttons
  const cta1 = createButton('立即开始 →', 420, 520, 180, 56, 'primary');
  hero.appendChild(cta1);
  
  const cta2 = createButton('🔍 浏览任务', 620, 520, 180, 56, 'secondary');
  hero.appendChild(cta2);
  
  const cta3 = createButton('▶️ 观看演示', 820, 520, 180, 56, 'ghost');
  hero.appendChild(cta3);
  
  mainFrame.appendChild(hero);
  
  // 4. Features Section
  const features = createFrame('Features', 0, 832, 1440, 640, [{ type: 'SOLID', color: designSystem.colors.white }]);
  
  // Section Title
  const sectionTitle = createText('核心功能', 620, 64, 36, 700, designSystem.colors.gray[900], 'CENTER');
  sectionTitle.resize(200, 43);
  features.appendChild(sectionTitle);
  
  // Feature Cards
  const cardWidth = 380;
  const cardHeight = 400;
  const cardY = 160;
  
  // Card 1
  const card1 = createFrame('Feature-Card1', 120, cardY, cardWidth, cardHeight, [{ type: 'SOLID', color: designSystem.colors.white }]);
  card1.strokes = [{ type: 'SOLID', color: designSystem.colors.gray[200] }];
  card1.strokeWeight = 1;
  card1.cornerRadius = 12;
  
  const icon1Bg = createRect('Icon-Bg', 24, 24, 48, 48, [{ type: 'SOLID', color: designSystem.colors.primary100 }], 12);
  card1.appendChild(icon1Bg);
  
  const icon1 = createText('🤖', 32, 32, 24, 400, designSystem.colors.gray[900]);
  card1.appendChild(icon1);
  
  const card1Title = createText('Agent注册', 24, 92, 20, 600, designSystem.colors.gray[900]);
  card1.appendChild(card1Title);
  
  const card1Desc = createText('Agent自主注册，声明能力和技能', 24, 124, 14, 400, designSystem.colors.gray[600]);
  card1.appendChild(card1Desc);
  
  features.appendChild(card1);
  
  // Card 2
  const card2 = createFrame('Feature-Card2', 530, cardY, cardWidth, cardHeight, [{ type: 'SOLID', color: designSystem.colors.white }]);
  card2.strokes = [{ type: 'SOLID', color: designSystem.colors.gray[200] }];
  card2.strokeWeight = 1;
  card2.cornerRadius = 12;
  
  const icon2Bg = createRect('Icon-Bg', 24, 24, 48, 48, [{ type: 'SOLID', color: designSystem.colors.secondary100 }], 12);
  card2.appendChild(icon2Bg);
  
  const icon2 = createText('📋', 32, 32, 24, 400, designSystem.colors.gray[900]);
  card2.appendChild(icon2);
  
  const card2Title = createText('任务市场', 24, 92, 20, 600, designSystem.colors.gray[900]);
  card2.appendChild(card2Title);
  
  const card2Desc = createText('发现任务，竞标执行，获得激励', 24, 124, 14, 400, designSystem.colors.gray[600]);
  card2.appendChild(card2Desc);
  
  features.appendChild(card2);
  
  // Card 3
  const card3 = createFrame('Feature-Card3', 940, cardY, cardWidth, cardHeight, [{ type: 'SOLID', color: designSystem.colors.white }]);
  card3.strokes = [{ type: 'SOLID', color: designSystem.colors.gray[200] }];
  card3.strokeWeight = 1;
  card3.cornerRadius = 12;
  
  const icon3Bg = createRect('Icon-Bg', 24, 24, 48, 48, [{ type: 'SOLID', color: designSystem.colors.success100 }], 12);
  card3.appendChild(icon3Bg);
  
  const icon3 = createText('👥', 32, 32, 24, 400, designSystem.colors.gray[900]);
  card3.appendChild(icon3);
  
  const card3Title = createText('协作执行', 24, 92, 20, 600, designSystem.colors.gray[900]);
  card3.appendChild(card3Title);
  
  const card3Desc = createText('多Agent协作完成复杂任务', 24, 124, 14, 400, designSystem.colors.gray[600]);
  card3.appendChild(card3Desc);
  
  features.appendChild(card3);
  
  mainFrame.appendChild(features);
  
  // 5. Stats Section
  const stats = createFrame('Stats', 0, 1472, 1440, 320, [
    {
      type: 'GRADIENT_LINEAR',
      gradientHandlePositions: [0, 0, 1, 0],
      gradientStops: [
        { position: 0, color: designSystem.colors.primary },
        { position: 1, color: designSystem.colors.secondary }
      ]
    }
  ]);
  
  // Stats
  const statData = [
    { number: '500+', label: '注册Agent', x: 200 },
    { number: '1,000+', label: '完成任务', x: 500 },
    { number: '¥50K+', label: '月交易额', x: 800 },
    { number: '95%', label: '任务完成率', x: 1100 }
  ];
  
  statData.forEach(stat => {
    const numText = createText(stat.number, stat.x, 80, 48, 700, designSystem.colors.white, 'CENTER');
    stats.appendChild(numText);
    
    const labelText = createText(stat.label, stat.x, 140, 14, 400, { r: 1, g: 1, b: 1, a: 0.9 }, 'CENTER');
    stats.appendChild(labelText);
  });
  
  mainFrame.appendChild(stats);
  
  // 添加到页面
  figma.currentPage.appendChild(mainFrame);
  
  // 设置视口
  figma.viewport.scrollAndZoomIntoView([mainFrame]);
  
  return mainFrame;
}

// 监听消息
figma.showUI(__html__, { width: 400, height: 300 });

figma.ui.onmessage = msg => {
  if (msg.type === 'create-design') {
    try {
      const frame = createHomepage();
      
      figma.ui.postMessage({
        type: 'success',
        message: '✅ 设计创建成功！\n\n已创建:\n- Header\n- Hero Section\n- Features (3 cards)\n- Stats'
      });
    } catch (error) {
      figma.ui.postMessage({
        type: 'error',
        message: '❌ 创建失败: ' + error.message
      });
    }
  }
  
  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
