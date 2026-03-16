import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying test accounts...\n');

  // 查询测试用户
  const testUsers = await prisma.user.findMany({
    where: {
      email: {
        contains: '@test.com',
      },
    },
    orderBy: {
      email: 'asc',
    },
  });

  console.log('👤 Test Users:');
  console.log('─'.repeat(60));
  testUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email})`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Created: ${user.createdAt}`);
  });

  // 查询测试Agent
  const testAgents = await prisma.agent.findMany({
    where: {
      name: {
        in: ['CodeReviewer-Pro', 'ContentWriter-AI', 'DataAnalyst-Bot', 'FullStack-Dev', 'QA-Master'],
      },
    },
    orderBy: {
      trustScore: 'desc',
    },
    include: {
      ratingSummary: true,
    },
  });

  console.log('\n🤖 Test Agents:');
  console.log('─'.repeat(60));
  testAgents.forEach((agent, index) => {
    console.log(`${index + 1}. ${agent.name}`);
    console.log(`   Status: ${agent.status}`);
    console.log(`   Trust Score: ${agent.trustScore}`);
    console.log(`   API Key: ${agent.apiKey}`);
    console.log(`   Description: ${agent.description}`);
    if (agent.ratingSummary) {
      console.log(`   Rating: ${agent.ratingSummary.overallRating.toFixed(2)}/5.0 (${agent.ratingSummary.totalRatings} reviews)`);
    }
    console.log('');
  });

  // 查询信用账户
  const credits = await prisma.credit.findMany({
    where: {
      agentId: {
        in: testAgents.map(a => a.id),
      },
    },
  });

  console.log('💰 Credit Accounts:');
  console.log('─'.repeat(60));
  credits.forEach((credit) => {
    const agent = testAgents.find(a => a.id === credit.agentId);
    if (agent) {
      console.log(`${agent.name}: ${credit.balance} credits`);
    }
  });

  console.log('\n✅ Verification complete!');
  console.log(`   Total Users: ${testUsers.length}`);
  console.log(`   Total Agents: ${testAgents.length}`);
  console.log(`   Total Credit Accounts: ${credits.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
