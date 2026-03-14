// Simple test to verify pricing service logic
const basePrices = {
  development: 500,
  design: 400,
  testing: 300,
  documentation: 250,
  analysis: 350,
  consulting: 600,
  default: 400,
};

function getBasePriceByCategory(category) {
  return basePrices[category] || basePrices['default'];
}

function calculateComplexity(description, requirements) {
  let complexity = 1.0;

  if (description) {
    const descLength = description.length;
    const complexKeywords = [
      '算法',
      '优化',
      '架构',
      '集成',
      '分布式',
      '微服务',
      '机器学习',
      'AI',
      '区块链',
      '高并发',
      'algorithm',
      'optimization',
      'architecture',
      'integration',
      'distributed',
      'microservice',
      'machine learning',
      'blockchain',
      'concurrent',
    ];

    if (descLength > 500) complexity += 0.3;
    else if (descLength > 200) complexity += 0.15;

    const keywordCount = complexKeywords.filter((keyword) =>
      description.toLowerCase().includes(keyword.toLowerCase()),
    ).length;
    complexity += keywordCount * 0.15;
  }

  if (requirements?.skills) {
    const advancedSkills = [
      'tensorflow',
      'pytorch',
      'kubernetes',
      'docker',
      'aws',
      'gcp',
      'azure',
      'react',
      'vue',
      'angular',
      'node.js',
      'python',
      'go',
      'rust',
      'blockchain',
    ];
    const advancedCount = requirements.skills.filter((skill) =>
      advancedSkills.some((adv) => skill.toLowerCase().includes(adv)),
    ).length;
    complexity += advancedCount * 0.1;
  }

  if (requirements?.minTrustScore) {
    if (requirements.minTrustScore >= 80) complexity += 0.3;
    else if (requirements.minTrustScore >= 60) complexity += 0.15;
  }

  return Math.max(0.8, Math.min(3.0, complexity));
}

function calculateSkillPremium(skills) {
  if (!skills || skills.length === 0) return 1.0;

  const premiumSkills = [
    'machine learning',
    'ai',
    'blockchain',
    'kubernetes',
    '微服务',
    '机器学习',
    '人工智能',
    '区块链',
  ];

  const premiumCount = skills.filter((skill) =>
    premiumSkills.some((premium) => skill.toLowerCase().includes(premium.toLowerCase())),
  ).length;

  return Math.min(1.5, 1.0 + premiumCount * 0.1);
}

function calculateUrgencyMultiplier(deadline) {
  if (!deadline) return 1.0;

  const deadlineDate = new Date(deadline);
  const now = new Date();
  const daysUntilDeadline = Math.ceil(
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilDeadline <= 1) return 1.5;
  if (daysUntilDeadline <= 3) return 1.3;
  if (daysUntilDeadline <= 7) return 1.15;
  if (daysUntilDeadline <= 14) return 1.05;
  return 1.0;
}

function suggestPrice(category, description, requirements, deadline) {
  const basePrice = getBasePriceByCategory(category);
  const complexityMultiplier = calculateComplexity(description, requirements);
  const marketAdjustment = 1.15; // Default market adjustment
  const skillPremium = calculateSkillPremium(requirements?.skills || []);
  const urgencyMultiplier = calculateUrgencyMultiplier(deadline);

  const adjustedBase =
    basePrice * complexityMultiplier * marketAdjustment * skillPremium * urgencyMultiplier;

  const minPrice = adjustedBase * 0.8;
  const maxPrice = adjustedBase * 1.2;
  const recommended = (minPrice + maxPrice) / 2;

  return {
    min: Math.round(minPrice),
    max: Math.round(maxPrice),
    recommended: Math.round(recommended),
    breakdown: {
      basePrice,
      complexityMultiplier,
      marketAdjustment,
      skillPremium,
      urgencyMultiplier,
    },
  };
}

// Test cases
console.log('=== Task Pricing Algorithm Test ===\n');

console.log('Test 1: Simple Development Task');
const test1 = suggestPrice('development', '简单的登录页面开发', {}, null);
console.log('Result:', test1);
console.log('Expected: Reasonable price around 400-600 CNY\n');

console.log('Test 2: Complex AI Task');
const test2 = suggestPrice(
  'development',
  '开发一个基于机器学习的推荐系统,需要集成多个微服务,支持高并发',
  { skills: ['machine learning', 'tensorflow', 'kubernetes'] },
  new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
);
console.log('Result:', test2);
console.log('Expected: Higher price due to complexity and urgency\n');

console.log('Test 3: Documentation Task');
const test3 = suggestPrice('documentation', '编写API文档', {}, null);
console.log('Result:', test3);
console.log('Expected: Lower price than development tasks\n');

console.log('Test 4: Urgent Task');
const tomorrow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
const test4 = suggestPrice('development', '紧急bug修复', {}, tomorrow);
console.log('Result:', test4);
console.log('Expected: Price increased by 1.5x due to urgency\n');

console.log('=== All Tests Completed ===');
