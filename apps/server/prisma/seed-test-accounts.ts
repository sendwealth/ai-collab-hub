import { PrismaClient, CertificationLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始创建测试账号...\n');

  // 1. Gold级别Agent
  const goldAgent = await prisma.agent.upsert({
    where: { id: 'agent-gold-001' },
    update: {},
    create: {
      id: 'agent-gold-001',
      name: '高级开发者-张三',
      email: 'zhangsan@aicollab.com',
      apiKey: 'sk_test_gold_abc123xyz',
      skills: ['后端开发', '架构设计', '代码审查'],
    },
  });

  const goldCertification = await prisma.certification.upsert({
    where: { agentId: 'agent-gold-001' },
    update: {},
    create: {
      agentId: 'agent-gold-001',
      level: CertificationLevel.GOLD,
      score: 92,
      totalQuestions: 10,
      correctAnswers: 9,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  });

  const goldDeposit = await prisma.deposit.upsert({
    where: { agentId: 'agent-gold-001' },
    update: {},
    create: {
      agentId: 'agent-gold-001',
      balance: 10000,
      frozenAmount: 0,
    },
  });

  console.log('✅ Gold账号创建成功:', goldAgent.name);

  // 2. Silver级别Agent
  const silverAgent = await prisma.agent.upsert({
    where: { id: 'agent-silver-002' },
    update: {},
    create: {
      id: 'agent-silver-002',
      name: '中级开发者-李四',
      email: 'lisi@aicollab.com',
      apiKey: 'sk_test_silver_def456uvw',
      skills: ['前端开发', 'UI设计'],
    },
  });

  const silverCertification = await prisma.certification.upsert({
    where: { agentId: 'agent-silver-002' },
    update: {},
    create: {
      agentId: 'agent-silver-002',
      level: CertificationLevel.SILVER,
      score: 75,
      totalQuestions: 10,
      correctAnswers: 7,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    },
  });

  const silverDeposit = await prisma.deposit.upsert({
    where: { agentId: 'agent-silver-002' },
    update: {},
    create: {
      agentId: 'agent-silver-002',
      balance: 5000,
      frozenAmount: 0,
    },
  });

  console.log('✅ Silver账号创建成功:', silverAgent.name);

  // 3. Bronze级别Agent
  const bronzeAgent = await prisma.agent.upsert({
    where: { id: 'agent-bronze-003' },
    update: {},
    create: {
      id: 'agent-bronze-003',
      name: '初级开发者-王五',
      email: 'wangwu@aicollab.com',
      apiKey: 'sk_test_bronze_ghi789rst',
      skills: ['测试', '文档编写'],
    },
  });

  const bronzeCertification = await prisma.certification.upsert({
    where: { agentId: 'agent-bronze-003' },
    update: {},
    create: {
      agentId: 'agent-bronze-003',
      level: CertificationLevel.BRONZE,
      score: 45,
      totalQuestions: 10,
      correctAnswers: 4,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  const bronzeDeposit = await prisma.deposit.upsert({
    where: { agentId: 'agent-bronze-003' },
    update: {},
    create: {
      agentId: 'agent-bronze-003',
      balance: 1000,
      frozenAmount: 0,
    },
  });

  console.log('✅ Bronze账号创建成功:', bronzeAgent.name);

  // 4. 新Agent (未认证)
  const newAgent = await prisma.agent.upsert({
    where: { id: 'agent-new-004' },
    update: {},
    create: {
      id: 'agent-new-004',
      name: '新手Agent-赵六',
      email: 'zhaoliu@aicollab.com',
      apiKey: 'sk_test_new_jkl012mno',
      skills: [],
    },
  });

  const newDeposit = await prisma.deposit.upsert({
    where: { agentId: 'agent-new-004' },
    update: {},
    create: {
      agentId: 'agent-new-004',
      balance: 0,
      frozenAmount: 0,
    },
  });

  console.log('✅ 新手账号创建成功:', newAgent.name);

  console.log('\n🎉 所有测试账号创建完成！\n');
  console.log('📋 账号列表:');
  console.log('1. agent-gold-001 (Gold) - sk_test_gold_abc123xyz - ¥10,000');
  console.log('2. agent-silver-002 (Silver) - sk_test_silver_def456uvw - ¥5,000');
  console.log('3. agent-bronze-003 (Bronze) - sk_test_bronze_ghi789rst - ¥1,000');
  console.log('4. agent-new-004 (未认证) - sk_test_new_jkl012mno - ¥0');
}

main()
  .catch((e) => {
    console.error('❌ 创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
