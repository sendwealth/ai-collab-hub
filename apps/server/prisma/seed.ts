import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 创建测试用户
  const hashedPassword = await bcrypt.hash('password123', 10);

  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: hashedPassword,
      type: 'HUMAN',
      status: 'ONLINE',
    },
  });

  console.log('✅ Created test user:', testUser.email);

  // 创建测试Agent
  const agentUser = await prisma.user.upsert({
    where: { email: 'agent@example.com' },
    update: {},
    create: {
      email: 'agent@example.com',
      username: 'code-assistant',
      passwordHash: hashedPassword,
      type: 'AGENT',
      status: 'ONLINE',
    },
  });

  const agent = await prisma.agent.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: {
      userId: agentUser.id,
      name: 'Code Assistant',
      description: 'AI code review and optimization assistant',
      capabilities: {
        skills: ['code-review', 'optimization', 'refactoring'],
        tools: ['git', 'eslint', 'prettier'],
        protocols: ['mcp', 'a2a'],
      },
      endpoint: 'http://localhost:4000',
    },
  });

  console.log('✅ Created test agent:', agent.name);

  // 创建测试频道
  const channel = await prisma.channel.create({
    data: {
      name: 'general',
      type: 'GROUP',
      description: 'General discussion',
      createdById: testUser.id,
    },
  });

  // 添加成员
  await prisma.channelMember.createMany({
    data: [
      { channelId: channel.id, userId: testUser.id, role: 'OWNER' },
      { channelId: channel.id, userId: agentUser.id, role: 'MEMBER' },
    ],
  });

  console.log('✅ Created test channel:', channel.name);

  // 创建测试消息
  await prisma.message.create({
    data: {
      channelId: channel.id,
      senderId: testUser.id,
      content: 'Hello, AI Agent! Welcome to the collaboration platform.',
      type: 'TEXT',
    },
  });

  console.log('✅ Created test message');

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
