import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/common/prisma/prisma.service';

describe('Credits Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let agentToken: string;
  let agentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test agent
    const agent = await prisma.agent.create({
      data: {
        name: 'test-credits-agent',
        publicKey: 'test-public-key',
        apiKey: 'test-api-key-credits',
      },
    });
    agentId = agent.id;
    agentToken = agent.apiKey;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.creditTransaction.deleteMany({
      where: { agentId },
    });
    await prisma.credit.deleteMany({
      where: { agentId },
    });
    await prisma.agent.delete({
      where: { id: agentId },
    });
    await app.close();
  });

  describe('Complete credits workflow', () => {
    it('should handle complete deposit -> transfer -> withdraw flow', async () => {
      // Create receiver agent
      const receiver = await prisma.agent.create({
        data: {
          name: 'test-receiver-agent',
          publicKey: 'test-receiver-public-key',
          apiKey: 'test-receiver-api-key',
        },
      });

      // Initialize receiver credit account
      await prisma.credit.create({
        data: {
          agentId: receiver.id,
          balance: 0,
        },
      });

      // 1. Check initial balance
      const initialBalance = await request(app.getHttpServer())
        .get('/credits/balance')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(initialBalance.body).toMatchObject({
        balance: 0,
        frozenBalance: 0,
        availableBalance: 0,
      });

      // 2. Deposit credits
      const depositResult = await request(app.getHttpServer())
        .post('/credits/deposit')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ amount: 1000, description: 'Initial deposit' })
        .expect(201);

      expect(depositResult.body).toMatchObject({
        amount: 1000,
        newBalance: 1000,
      });

      // 3. Transfer credits
      const transferResult = await request(app.getHttpServer())
        .post('/credits/transfer')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ toAgentId: receiver.id, amount: 300, description: 'Payment' })
        .expect(201);

      expect(transferResult.body).toMatchObject({
        amount: 300,
        senderNewBalance: 700,
        receiverNewBalance: 300,
      });

      // 4. Freeze some credits
      const freezeResult = await request(app.getHttpServer())
        .post('/credits/freeze')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ amount: 200, description: 'Security deposit' })
        .expect(201);

      expect(freezeResult.body).toMatchObject({
        frozenAmount: 200,
        totalFrozen: 200,
        availableBalance: 500,
      });

      // 5. Try to withdraw more than available (should fail)
      await request(app.getHttpServer())
        .post('/credits/withdraw')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ amount: 600 })
        .expect(400);

      // 6. Withdraw available amount
      const withdrawResult = await request(app.getHttpServer())
        .post('/credits/withdraw')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ amount: 400 })
        .expect(201);

      expect(withdrawResult.body).toMatchObject({
        amount: 400,
        newBalance: 300,
      });

      // 7. Unfreeze credits
      const unfreezeResult = await request(app.getHttpServer())
        .post('/credits/unfreeze')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ amount: 100 })
        .expect(201);

      expect(unfreezeResult.body).toMatchObject({
        unfrozenAmount: 100,
        totalFrozen: 100,
        availableBalance: 200,
      });

      // 8. Check transaction history
      const history = await request(app.getHttpServer())
        .get('/credits/transactions')
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(history.body.transactions).toHaveLength(5);
      expect(history.body.total).toBe(5);

      // Clean up receiver
      await prisma.creditTransaction.deleteMany({
        where: { agentId: receiver.id },
      });
      await prisma.credit.delete({
        where: { agentId: receiver.id },
      });
      await prisma.agent.delete({
        where: { id: receiver.id },
      });
    });

    it('should handle concurrent transfers correctly', async () => {
      // Create multiple receiver agents
      const receivers = await Promise.all(
        [1, 2, 3].map((i) =>
          prisma.agent.create({
            data: {
              name: `test-receiver-${i}`,
              publicKey: `test-public-key-${i}`,
              apiKey: `test-api-key-${i}`,
            },
          }),
        ),
      );

      // Initialize receiver credit accounts
      await Promise.all(
        receivers.map((receiver) =>
          prisma.credit.create({
            data: {
              agentId: receiver.id,
              balance: 0,
            },
          }),
        ),
      );

      // Ensure sender has enough balance
      const credit = await prisma.credit.findUnique({
        where: { agentId },
      });
      if (!credit || credit.balance < 1000) {
        await prisma.credit.upsert({
          where: { agentId },
          create: { agentId, balance: 1000, totalEarned: 1000 },
          update: { balance: 1000, totalEarned: 1000 },
        });
      }

      // Execute concurrent transfers
      const transferPromises = receivers.map((receiver, i) =>
        request(app.getHttpServer())
          .post('/credits/transfer')
          .set('Authorization', `Bearer ${agentToken}`)
          .send({ toAgentId: receiver.id, amount: 100 })
          .then((res) => ({ res, index: i })),
      );

      const results = await Promise.allSettled(transferPromises);

      // Check that some transfers succeeded
      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value.res.status === 201,
      );
      expect(successful.length).toBeGreaterThan(0);

      // Clean up receivers
      await Promise.all(
        receivers.map(async (receiver) => {
          await prisma.creditTransaction.deleteMany({
            where: { agentId: receiver.id },
          });
          await prisma.credit.delete({
            where: { agentId: receiver.id },
          });
          await prisma.agent.delete({
            where: { id: receiver.id },
          });
        }),
      );
    });
  });

  describe('Edge cases', () => {
    it('should reject negative amounts', async () => {
      await request(app.getHttpServer())
        .post('/credits/deposit')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ amount: -100 })
        .expect(400);
    });

    it('should reject transfer to self', async () => {
      await request(app.getHttpServer())
        .post('/credits/transfer')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ toAgentId: agentId, amount: 100 })
        .expect(400);
    });

    it('should reject transfer to non-existent agent', async () => {
      await request(app.getHttpServer())
        .post('/credits/transfer')
        .set('Authorization', `Bearer ${agentToken}`)
        .send({ toAgentId: 'non-existent-agent', amount: 100 })
        .expect(404);
    });

    it('should handle pagination in transaction history', async () => {
      // Create multiple transactions
      for (let i = 0; i < 25; i++) {
        await prisma.creditTransaction.create({
          data: {
            agentId,
            type: 'deposit',
            amount: 10,
            balance: 100,
            description: `Test transaction ${i}`,
          },
        });
      }

      // Get first page
      const page1 = await request(app.getHttpServer())
        .get('/credits/transactions')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(page1.body.transactions).toHaveLength(10);
      expect(page1.body.page).toBe(1);
      expect(page1.body.limit).toBe(10);

      // Get second page
      const page2 = await request(app.getHttpServer())
        .get('/credits/transactions')
        .query({ page: 2, limit: 10 })
        .set('Authorization', `Bearer ${agentToken}`)
        .expect(200);

      expect(page2.body.transactions).toHaveLength(10);
      expect(page2.body.page).toBe(2);

      // Clean up extra transactions
      await prisma.creditTransaction.deleteMany({
        where: {
          agentId,
          description: { startsWith: 'Test transaction' },
        },
      });
    });
  });
});
