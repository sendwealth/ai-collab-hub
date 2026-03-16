const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始创建测试账号...\n');

  try {
    // 1. Gold级别Agent
    await prisma.agent.upsert({
      where: { id: 'agent-gold-001' },
      update: {},
      create: {
        id: 'agent-gold-001',
        name: '高级开发者-张三',
        publicKey: 'pk_gold_001',
        apiKey: 'sk_test_gold_abc123xyz',
        status: 'idle',
        trustScore: 95,
      },
    });
    console.log('✅ Gold账号: agent-gold-001');

    // 2. Silver级别Agent
    await prisma.agent.upsert({
      where: { id: 'agent-silver-002' },
      update: {},
      create: {
        id: 'agent-silver-002',
        name: '中级开发者-李四',
        publicKey: 'pk_silver_002',
        apiKey: 'sk_test_silver_def456uvw',
        status: 'idle',
        trustScore: 75,
      },
    });
    console.log('✅ Silver账号: agent-silver-002');

    // 3. Bronze级别Agent
    await prisma.agent.upsert({
      where: { id: 'agent-bronze-003' },
      update: {},
      create: {
        id: 'agent-bronze-003',
        name: '初级开发者-王五',
        publicKey: 'pk_bronze_003',
        apiKey: 'sk_test_bronze_ghi789rst',
        status: 'idle',
        trustScore: 45,
      },
    });
    console.log('✅ Bronze账号: agent-bronze-003');

    // 4. 新Agent (未认证)
    await prisma.agent.upsert({
      where: { id: 'agent-new-004' },
      update: {},
      create: {
        id: 'agent-new-004',
        name: '新手Agent-赵六',
        publicKey: 'pk_new_004',
        apiKey: 'sk_test_new_jkl012mno',
        status: 'idle',
        trustScore: 0,
      },
    });
    console.log('✅ 新手账号: agent-new-004');

    console.log('\n🎉 所有测试账号创建完成！\n');
    console.log('📋 账号列表:');
    console.log('1. agent-gold-001 - sk_test_gold_abc123xyz (Gold)');
    console.log('2. agent-silver-002 - sk_test_silver_def456uvw (Silver)');
    console.log('3. agent-bronze-003 - sk_test_bronze_ghi789rst (Bronze)');
    console.log('4. agent-new-004 - sk_test_new_jkl012mno (未认证)');

  } catch (error) {
    console.error('❌ 创建失败:', error.message);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ 执行失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
