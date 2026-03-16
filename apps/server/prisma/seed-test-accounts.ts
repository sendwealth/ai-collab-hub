import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

/**
 * 创建测试用户账号
 * 注意：User模型主要用于评分系统，不存储密码
 * 这里创建User记录用于测试评分功能
 */
async function seedTestUsers() {
  console.log('\n👤 Creating test user accounts...');

  const testUsers = [
    {
      email: 'publisher@test.com',
      name: '测试发布者',
      avatar: null,
    },
    {
      email: 'agent@test.com',
      name: '测试Agent用户',
      avatar: null,
    },
    {
      email: 'admin@test.com',
      name: '测试管理员',
      avatar: null,
    },
  ];

  const createdUsers = [];

  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    createdUsers.push(user);
    console.log(`  ✅ Created user: ${user.name} (${user.email})`);
  }

  return createdUsers;
}

/**
 * 创建测试Agent账号
 * Agent使用API Key进行认证
 */
async function seedTestAgents() {
  console.log('\n🤖 Creating test agent accounts...');

  const testAgents = [
    {
      name: 'CodeReviewer-Pro',
      description: '专业代码审查Agent，擅长代码质量分析、安全漏洞检测',
      publicKey: `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAcode-reviewer-pro\n-----END PUBLIC KEY-----`,
      capabilities: JSON.stringify({
        skills: ['code-review', 'security', 'performance'],
        languages: ['TypeScript', 'Python', 'Go'],
        experience: '5年',
      }),
      status: 'idle',
      trustScore: 95,
      hourlyRate: 100,
      timezone: 'Asia/Shanghai',
    },
    {
      name: 'ContentWriter-AI',
      description: '内容创作Agent，擅长技术文档、博客文章、API文档',
      publicKey: `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAcontent-writer-ai\n-----END PUBLIC KEY-----`,
      capabilities: JSON.stringify({
        skills: ['content-writing', 'documentation', 'translation'],
        languages: ['中文', '英文'],
        experience: '3年',
      }),
      status: 'idle',
      trustScore: 88,
      hourlyRate: 80,
      timezone: 'Asia/Shanghai',
    },
    {
      name: 'DataAnalyst-Bot',
      description: '数据分析Agent，擅长数据可视化、统计分析、报表生成',
      publicKey: `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAdata-analyst-bot\n-----END PUBLIC KEY-----`,
      capabilities: JSON.stringify({
        skills: ['data-analysis', 'visualization', 'statistics'],
        tools: ['Python', 'SQL', 'Tableau'],
        experience: '4年',
      }),
      status: 'idle',
      trustScore: 92,
      hourlyRate: 120,
      timezone: 'Asia/Shanghai',
    },
    {
      name: 'FullStack-Dev',
      description: '全栈开发Agent，前后端开发、系统架构设计',
      publicKey: `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAfullstack-dev\n-----END PUBLIC KEY-----`,
      capabilities: JSON.stringify({
        skills: ['frontend', 'backend', 'database', 'architecture'],
        stack: ['React', 'Node.js', 'PostgreSQL'],
        experience: '6年',
      }),
      status: 'busy',
      trustScore: 96,
      hourlyRate: 150,
      timezone: 'Asia/Shanghai',
    },
    {
      name: 'QA-Master',
      description: '测试Agent，自动化测试、性能测试、安全测试',
      publicKey: `-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqa-master\n-----END PUBLIC KEY-----`,
      capabilities: JSON.stringify({
        skills: ['automation', 'performance-testing', 'security-testing'],
        tools: ['Jest', 'Cypress', 'k6'],
        experience: '4年',
      }),
      status: 'idle',
      trustScore: 90,
      hourlyRate: 90,
      timezone: 'Asia/Shanghai',
    },
  ];

  const createdAgents = [];

  for (const agentData of testAgents) {
    // 生成唯一的API Key
    const apiKey = `test_${agentData.name.toLowerCase().replace(/-/g, '_')}_${uuidv4()}`;

    const agent = await prisma.agent.upsert({
      where: { name: agentData.name },
      update: {
        description: agentData.description,
        capabilities: agentData.capabilities,
        status: agentData.status,
        trustScore: agentData.trustScore,
        hourlyRate: agentData.hourlyRate,
        timezone: agentData.timezone,
      },
      create: {
        name: agentData.name,
        description: agentData.description,
        publicKey: agentData.publicKey,
        apiKey: apiKey,
        capabilities: agentData.capabilities,
        status: agentData.status,
        trustScore: agentData.trustScore,
        hourlyRate: agentData.hourlyRate,
        timezone: agentData.timezone,
      },
    });

    createdAgents.push({ ...agent, apiKey });
    console.log(`  ✅ Created agent: ${agent.name} (Trust Score: ${agent.trustScore})`);
    console.log(`     📍 API Key: ${apiKey}`);
  }

  return createdAgents;
}

/**
 * 为每个Agent创建信用账户
 */
async function seedAgentCredits(agents: any[]) {
  console.log('\n💰 Creating credit accounts for agents...');

  for (const agent of agents) {
    const credit = await prisma.credit.upsert({
      where: { agentId: agent.id },
      update: {},
      create: {
        agentId: agent.id,
        balance: 1000, // 初始积分
        frozenBalance: 0,
        totalEarned: 0,
        totalSpent: 0,
      },
    });
    console.log(`  ✅ Created credit account for ${agent.name}: ${credit.balance} credits`);
  }
}

/**
 * 为每个Agent创建评分汇总
 */
async function seedAgentRatingSummaries(agents: any[]) {
  console.log('\n⭐ Creating rating summaries for agents...');

  for (const agent of agents) {
    // 根据信任分数生成合理的评分
    const baseRating = agent.trustScore / 20; // 转换为5分制
    const randomVariation = (Math.random() - 0.5) * 0.4; // 添加一些随机变化

    const avgQuality = Math.min(5, Math.max(3, baseRating + randomVariation));
    const avgSpeed = Math.min(5, Math.max(3, baseRating + (Math.random() - 0.5) * 0.6));
    const avgCommunication = Math.min(5, Math.max(3, baseRating + (Math.random() - 0.5) * 0.6));
    const avgProfessionalism = Math.min(5, Math.max(3, baseRating + (Math.random() - 0.5) * 0.6));
    const overallRating = (avgQuality + avgSpeed + avgCommunication + avgProfessionalism) / 4;

    const summary = await prisma.agentRatingSummary.upsert({
      where: { agentId: agent.id },
      update: {},
      create: {
        agentId: agent.id,
        avgQuality,
        avgSpeed,
        avgCommunication,
        avgProfessionalism,
        overallRating,
        totalRatings: Math.floor(Math.random() * 50) + 10,
        rating5Count: Math.floor(Math.random() * 20) + 5,
        rating4Count: Math.floor(Math.random() * 15) + 3,
        rating3Count: Math.floor(Math.random() * 10) + 2,
        rating2Count: Math.floor(Math.random() * 5),
        rating1Count: Math.floor(Math.random() * 2),
      },
    });

    console.log(
      `  ✅ Created rating summary for ${agent.name}: ${summary.overallRating.toFixed(2)}/5.0`,
    );
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🌱 Starting test accounts seeding...\n');
  console.log('=' .repeat(60));

  try {
    // 创建测试用户
    const users = await seedTestUsers();

    // 创建测试Agent
    const agents = await seedTestAgents();

    // 为Agent创建信用账户
    await seedAgentCredits(agents);

    // 为Agent创建评分汇总
    await seedAgentRatingSummaries(agents);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 Test accounts seeding completed!\n');

    // 打印总结报告
    console.log('📊 Summary Report:');
    console.log('─'.repeat(60));
    
    console.log('\n👤 Test Users (3):');
    console.log('─'.repeat(60));
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
    });

    console.log('\n🤖 Test Agents (5):');
    console.log('─'.repeat(60));
    agents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name}`);
      console.log(`   Description: ${agent.description}`);
      console.log(`   Status: ${agent.status}`);
      console.log(`   Trust Score: ${agent.trustScore}`);
      console.log(`   API Key: ${agent.apiKey}`);
      console.log(`   ID: ${agent.id}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('📝 Note:');
    console.log('   - Users are created for rating purposes (no password authentication)');
    console.log('   - Agents use API Key authentication');
    console.log('   - Each agent has initial 1000 credits');
    console.log('   - Rating summaries are generated based on trust scores');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
