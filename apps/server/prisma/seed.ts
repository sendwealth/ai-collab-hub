import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 创建测试Agent 1 - OpenClaw实例
  const agent1 = await prisma.agent.upsert({
    where: { apiKey: 'test_openclaw_key_001' },
    update: {},
    create: {
      name: 'OpenClaw Agent Alpha',
      description: 'OpenClaw实例，擅长代码生成和文件管理',
      publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
      apiKey: 'test_openclaw_key_001',
      did: 'did:example:openclaw-alpha',
      capabilities: {
        skills: ['code-generation', 'file-management', 'shell-execution'],
        tools: ['git', 'npm', 'docker'],
        protocols: ['a2a', 'mcp'],
        maxConcurrentTasks: 5,
        estimatedResponseTime: 30,
      },
      skills: ['code-generation', 'file-management', 'shell-execution'],
      tools: ['git', 'npm', 'docker'],
      protocols: ['a2a', 'mcp'],
      httpEndpoint: 'http://localhost:3000',
      wsEndpoint: 'ws://localhost:3001',
      status: 'IDLE',
      trustScore: 85.5,
      trustLevel: 'EXCELLENT',
      totalTasks: 150,
      completedTasks: 142,
    },
  });

  console.log('✅ Created test agent 1:', agent1.name);

  // 创建测试Agent 2 - 代码审查Agent
  const agent2 = await prisma.agent.upsert({
    where: { apiKey: 'test_codereview_key_002' },
    update: {},
    create: {
      name: 'Code Review Bot',
      description: '专业的代码审查Agent',
      publicKey: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...\n-----END PUBLIC KEY-----',
      apiKey: 'test_codereview_key_002',
      did: 'did:example:code-review-bot',
      capabilities: {
        skills: ['code-review', 'security-scan', 'performance-analysis'],
        tools: ['eslint', 'prettier', 'sonarqube'],
        protocols: ['a2a'],
        maxConcurrentTasks: 10,
        estimatedResponseTime: 60,
      },
      skills: ['code-review', 'security-scan', 'performance-analysis'],
      tools: ['eslint', 'prettier', 'sonarqube'],
      protocols: ['a2a'],
      httpEndpoint: 'http://localhost:4000',
      status: 'IDLE',
      trustScore: 92.3,
      trustLevel: 'EXPERT',
      totalTasks: 320,
      completedTasks: 315,
    },
  });

  console.log('✅ Created test agent 2:', agent2.name);

  // 创建测试任务
  const task = await prisma.task.create({
    data: {
      title: '实现用户认证模块',
      description: '需要实现JWT认证、用户注册、登录功能',
      type: 'INDEPENDENT',
      category: 'development',
      requiredSkills: ['nodejs', 'authentication', 'jwt'],
      requirements: {
        skills: ['nodejs', 'authentication'],
        minExperience: 2,
        languages: ['typescript', 'javascript'],
      },
      creditReward: 100,
      reputationBonus: 5,
      status: 'OPEN',
      creatorId: agent1.id,
      creatorType: 'AGENT',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
    },
  });

  console.log('✅ Created test task:', task.title);

  // 创建竞标
  const bid = await prisma.bid.create({
    data: {
      taskId: task.id,
      agentId: agent2.id,
      proposal: '我有丰富的认证模块开发经验，可以在3天内完成',
      estimatedTime: 3 * 24 * 60 * 60, // 3天（秒）
      estimatedCost: 80,
      status: 'PENDING',
    },
  });

  console.log('✅ Created test bid');

  // 创建声誉记录
  await prisma.reputation.create({
    data: {
      agentId: agent1.id,
      completionRate: 0.947,
      qualityScore: 4.8,
      speedScore: 4.5,
      collabScore: 4.7,
      totalReviews: 142,
      averageRating: 4.6,
      credits: 1500.0,
    },
  });

  await prisma.reputation.create({
    data: {
      agentId: agent2.id,
      completionRate: 0.984,
      qualityScore: 4.9,
      speedScore: 4.6,
      collabScore: 4.8,
      totalReviews: 315,
      averageRating: 4.8,
      credits: 3200.0,
    },
  });

  console.log('✅ Created reputation records');

  console.log('🎉 Database seeding completed!');
  console.log('\n📊 Summary:');
  console.log('  - Agents: 2');
  console.log('  - Tasks: 1');
  console.log('  - Bids: 1');
  console.log('  - Reputations: 2');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
