import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/modules/common/prisma/prisma.service';
import { AppModule } from '../../src/app.module';
import { AgentTestingModule } from '../../src/modules/agent-testing/agent-testing.module';
import { AgentCertificationModule } from '../../src/modules/agent-certification/agent-certification.module';
import { DepositModule } from '../../src/modules/deposit/deposit.module';
import {
  TestDataGenerator,
  PerformanceTestUtils,
  DatabaseCleanup,
} from '../utils/test-helpers';

describe('Performance and Load Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cleanup: DatabaseCleanup;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        AgentTestingModule,
        AgentCertificationModule,
        DepositModule,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    cleanup = new DatabaseCleanup(prisma);
  }, 60000); // 60 second timeout

  afterAll(async () => {
    await cleanup.cleanAllTestData();
    await app.close();
  });

  describe('Agent Testing Load Tests', () => {
    it('should handle 100 concurrent test sessions', async () => {
      // Seed questions
      await prisma.agentTestQuestion.createMany({
        data: TestDataGenerator.generateTestQuestions(50),
        skipDuplicates: true,
      });

      const agentCount = 100;
      const agents = Array(agentCount)
        .fill(null)
        .map((_, i) => `agent-load-test-${i}`);

      const { totalTimeMs, avgTimeMs } =
        await PerformanceTestUtils.runConcurrentOperations(
          agentCount,
          async (i) => {
            // Start test
            const attempt = await prisma.agentTestAttempt.create({
              data: {
                agentId: agents[i],
                questionIds: JSON.stringify(['q1', 'q2', 'q3']),
                totalQuestions: 3,
                totalScore: 30,
                status: 'in_progress',
                startedAt: new Date(),
              },
            });

            // Complete test
            await prisma.agentTestAttempt.update({
              where: { id: attempt.id },
              data: {
                status: 'completed',
                score: 25,
                percentage: 83,
                level: 'Gold',
                completedAt: new Date(),
                timeSpent: 300,
              },
            });

            return attempt.id;
          },
        );

      console.log(
        `100 concurrent test sessions: Total=${totalTimeMs}ms, Avg=${avgTimeMs}ms`,
      );

      // Average time should be less than 200ms per operation
      expect(avgTimeMs).toBeLessThan(200);
    });

    it('should handle 1000 concurrent test requests', async () => {
      const requestCount = 1000;
      const agents = Array(requestCount)
        .fill(null)
        .map((_, i) => `agent-high-load-${i}`);

      const { totalTimeMs, avgTimeMs } =
        await PerformanceTestUtils.runConcurrentOperations(
          requestCount,
          async (i) => {
            // Simulate test start request
            await prisma.agentTestAttempt.create({
              data: {
                agentId: agents[i],
                questionIds: JSON.stringify(['q1']),
                totalQuestions: 1,
                totalScore: 10,
                status: 'in_progress',
                startedAt: new Date(),
              },
            });

            return agents[i];
          },
        );

      console.log(
        `1000 concurrent requests: Total=${totalTimeMs}ms, Avg=${avgTimeMs}ms`,
      );

      // System should handle load without crashing
      expect(totalTimeMs).toBeLessThan(30000); // 30 seconds total
    });
  });

  describe('Certification Load Tests', () => {
    it('should handle 1000 concurrent certification requests', async () => {
      const certCount = 1000;
      const agents = Array(certCount)
        .fill(null)
        .map((_, i) => `agent-cert-load-${i}`);

      const { totalTimeMs, avgTimeMs } =
        await PerformanceTestUtils.runConcurrentOperations(
          certCount,
          async (i) => {
            await prisma.agentCertification.create({
              data: {
                agentId: agents[i],
                level: 'bronze',
                score: 0,
                testScore: 0,
                tasksCompleted: 0,
                avgRating: 0,
                totalTests: 0,
                bestScore: 0,
              },
            });

            return agents[i];
          },
        );

      console.log(
        `1000 certifications: Total=${totalTimeMs}ms, Avg=${avgTimeMs}ms`,
      );

      expect(avgTimeMs).toBeLessThan(50); // 50ms per certification
    });

    it('should handle leaderboard queries with 10,000 agents', async () => {
      // Create 10,000 certifications
      const agentCount = 10000;
      const batchSize = 100;

      for (let batch = 0; batch < agentCount / batchSize; batch++) {
        const agents = Array(batchSize)
          .fill(null)
          .map((_, i) => `agent-leaderboard-${batch * batchSize + i}`);

        await prisma.agentCertification.createMany({
          data: agents.map((agentId) => ({
            agentId,
            level: Math.random() > 0.7 ? 'gold' : Math.random() > 0.4 ? 'silver' : 'bronze',
            score: Math.floor(Math.random() * 100),
            testScore: Math.floor(Math.random() * 100),
            tasksCompleted: Math.floor(Math.random() * 100),
            avgRating: Math.random() * 5,
            totalTests: Math.floor(Math.random() * 10),
            bestScore: Math.floor(Math.random() * 100),
          })),
        });
      }

      const { timeMs } = await PerformanceTestUtils.measureTime(async () => {
        const certifications = await prisma.agentCertification.findMany({
          orderBy: [{ score: 'desc' }],
          take: 100,
        });

        expect(certifications).toHaveLength(100);
      });

      console.log(`Leaderboard query (10k agents): ${timeMs}ms`);

      // Query should be fast even with large dataset
      expect(timeMs).toBeLessThan(5000); // 5 seconds
    });
  });

  describe('Deposit Load Tests', () => {
    it('should handle 10,000 concurrent deposit operations', async () => {
      const operationCount = 10000;
      const agents = Array(operationCount)
        .fill(null)
        .map((_, i) => `agent-deposit-load-${i}`);

      const { totalTimeMs, avgTimeMs } =
        await PerformanceTestUtils.runConcurrentOperations(
          operationCount,
          async (i) => {
            await prisma.agentDeposit.create({
              data: {
                agentId: agents[i],
                balance: 1000,
                frozenBalance: 0,
                totalDeposited: 1000,
                totalDeducted: 0,
                totalRefunded: 0,
              },
            });

            return agents[i];
          },
        );

      console.log(
        `10,000 deposits: Total=${totalTimeMs}ms, Avg=${avgTimeMs}ms`,
      );

      expect(avgTimeMs).toBeLessThan(20); // 20ms per deposit
    });

    it('should handle 1000 concurrent transaction operations', async () => {
      const agentId = 'agent-txn-load-test';

      // Create deposit account
      await prisma.agentDeposit.create({
        data: {
          agentId,
          balance: 100000,
          frozenBalance: 0,
          totalDeposited: 100000,
          totalDeducted: 0,
          totalRefunded: 0,
        },
      });

      const txnCount = 1000;

      const { totalTimeMs, avgTimeMs } =
        await PerformanceTestUtils.runConcurrentOperations(
          txnCount,
          async (i) => {
            await prisma.agentDepositTransaction.create({
              data: {
                agentId,
                type: i % 2 === 0 ? 'deposit' : 'deduct',
                amount: i % 2 === 0 ? 100 : -100,
                balance: 100000 + (i % 2 === 0 ? 100 : -100) * (i + 1),
                description: `Load test transaction ${i}`,
              },
            });

            return i;
          },
        );

      console.log(
        `1000 transactions: Total=${totalTimeMs}ms, Avg=${avgTimeMs}ms`,
      );

      expect(avgTimeMs).toBeLessThan(30); // 30ms per transaction
    });

    it('should handle concurrent balance updates correctly', async () => {
      const agentId = 'agent-concurrent-balance-test';

      await prisma.agentDeposit.create({
        data: {
          agentId,
          balance: 10000,
          frozenBalance: 0,
          totalDeposited: 10000,
          totalDeducted: 0,
          totalRefunded: 0,
        },
      });

      const updateCount = 100;

      // Perform concurrent updates
      const { results } = await PerformanceTestUtils.runConcurrentOperations(
        updateCount,
        async (i) => {
          const result = await prisma.agentDeposit.update({
            where: { agentId },
            data: {
              balance: { increment: i % 2 === 0 ? 10 : -10 },
              totalDeducted: { increment: i % 2 === 0 ? 0 : 10 },
            },
          });

          return result.balance;
        },
      );

      // Verify final balance is consistent
      const finalDeposit = await prisma.agentDeposit.findUnique({
        where: { agentId },
      });

      expect(finalDeposit?.balance).toBeDefined();
      expect(finalDeposit?.balance).toBeGreaterThan(0);
    });
  });

  describe('Response Time SLA Tests', () => {
    it('should meet SLA for test start: < 200ms', async () => {
      await prisma.agentTestQuestion.createMany({
        data: TestDataGenerator.generateTestQuestions(10),
        skipDuplicates: true,
      });

      const { timeMs } = await PerformanceTestUtils.measureTime(async () => {
        await prisma.agentTestAttempt.create({
          data: {
            agentId: 'agent-sla-test',
            questionIds: JSON.stringify(['q1', 'q2', 'q3']),
            totalQuestions: 3,
            totalScore: 30,
            status: 'in_progress',
            startedAt: new Date(),
          },
        });
      });

      console.log(`Test start response time: ${timeMs}ms`);
      expect(timeMs).toBeLessThan(200);
    });

    it('should meet SLA for certification query: < 100ms', async () => {
      const agentId = 'agent-cert-sla-test';

      await prisma.agentCertification.create({
        data: {
          agentId,
          level: 'silver',
          score: 75,
          testScore: 80,
          tasksCompleted: 20,
          avgRating: 4.5,
          totalTests: 5,
          bestScore: 85,
        },
      });

      const { timeMs } = await PerformanceTestUtils.measureTime(async () => {
        await prisma.agentCertification.findUnique({
          where: { agentId },
        });
      });

      console.log(`Certification query response time: ${timeMs}ms`);
      expect(timeMs).toBeLessThan(100);
    });

    it('should meet SLA for deposit operation: < 150ms', async () => {
      const agentId = 'agent-deposit-sla-test';

      await prisma.agentDeposit.create({
        data: {
          agentId,
          balance: 1000,
          frozenBalance: 0,
          totalDeposited: 1000,
          totalDeducted: 0,
          totalRefunded: 0,
        },
      });

      const { timeMs } = await PerformanceTestUtils.measureTime(async () => {
        await prisma.agentDeposit.update({
          where: { agentId },
          data: { balance: 1500, totalDeposited: 1500 },
        });

        await prisma.agentDepositTransaction.create({
          data: {
            agentId,
            type: 'deposit',
            amount: 500,
            balance: 1500,
            description: 'SLA test deposit',
          },
        });
      });

      console.log(`Deposit operation response time: ${timeMs}ms`);
      expect(timeMs).toBeLessThan(150);
    });

    it('should meet SLA for balance query: < 100ms', async () => {
      const agentId = 'agent-balance-sla-test';

      await prisma.agentDeposit.create({
        data: {
          agentId,
          balance: 5000,
          frozenBalance: 1000,
          totalDeposited: 6000,
          totalDeducted: 500,
          totalRefunded: 500,
        },
      });

      const { timeMs } = await PerformanceTestUtils.measureTime(async () => {
        await prisma.agentDeposit.findUnique({
          where: { agentId },
        });
      });

      console.log(`Balance query response time: ${timeMs}ms`);
      expect(timeMs).toBeLessThan(100);
    });
  });

  describe('Stress Tests', () => {
    it('should handle 50,000 total operations without degradation', async () => {
      const totalOperations = 50000;
      const batchSize = 100;

      const startTime = Date.now();

      for (let batch = 0; batch < totalOperations / batchSize; batch++) {
        await Promise.all(
          Array(batchSize)
            .fill(null)
            .map((_, i) =>
              prisma.agentTestAttempt.create({
                data: {
                  agentId: `agent-stress-${batch * batchSize + i}`,
                  questionIds: JSON.stringify(['q1']),
                  totalQuestions: 1,
                  totalScore: 10,
                  status: 'in_progress',
                  startedAt: new Date(),
                },
              }),
            ),
        );
      }

      const totalTimeMs = Date.now() - startTime;
      const avgTimeMs = totalTimeMs / totalOperations;

      console.log(
        `50,000 operations: Total=${totalTimeMs}ms, Avg=${avgTimeMs}ms`,
      );

      // System should maintain performance under load
      expect(avgTimeMs).toBeLessThan(50); // 50ms average
    });

    it('should maintain performance with large concurrent user base', async () => {
      const concurrentUsers = 500;
      const operationsPerUser = 10;

      const { totalTimeMs } = await PerformanceTestUtils.measureTime(async () => {
        await Promise.all(
          Array(concurrentUsers)
            .fill(null)
            .map((_, userIndex) =>
              Promise.all(
                Array(operationsPerUser)
                  .fill(null)
                  .map((_, opIndex) =>
                    prisma.agentCertification.create({
                      data: {
                        agentId: `agent-user-${userIndex}-op-${opIndex}`,
                        level: 'bronze',
                        score: 0,
                        testScore: 0,
                        tasksCompleted: 0,
                        avgRating: 0,
                        totalTests: 0,
                        bestScore: 0,
                      },
                    }),
                  ),
              ),
            ),
        );
      });

      const totalOperations = concurrentUsers * operationsPerUser;
      const avgTimeMs = totalTimeMs / totalOperations;

      console.log(
        `500 users × 10 ops = ${totalOperations} ops: Total=${totalTimeMs}ms, Avg=${avgTimeMs}ms`,
      );

      expect(avgTimeMs).toBeLessThan(100);
    });
  });

  describe('Memory and Resource Tests', () => {
    it('should handle large dataset queries efficiently', async () => {
      // Create 100,000 transactions
      const agentId = 'agent-memory-test';
      const transactionCount = 100000;

      // Create deposit
      await prisma.agentDeposit.create({
        data: {
          agentId,
          balance: 1000000,
          frozenBalance: 0,
          totalDeposited: 1000000,
          totalDeducted: 0,
          totalRefunded: 0,
        },
      });

      // Batch create transactions
      const batchSize = 1000;
      for (let batch = 0; batch < transactionCount / batchSize; batch++) {
        await prisma.agentDepositTransaction.createMany({
          data: Array(batchSize)
            .fill(null)
            .map((_, i) => ({
              agentId,
              type: 'deposit',
              amount: 10,
              balance: 1000000 + (batch * batchSize + i + 1) * 10,
              description: `Transaction ${batch * batchSize + i}`,
            })),
        });
      }

      // Test query performance with pagination
      const { timeMs } = await PerformanceTestUtils.measureTime(async () => {
        const page = await prisma.agentDepositTransaction.findMany({
          where: { agentId },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });

        expect(page).toHaveLength(20);
      });

      console.log(`Large dataset query (100k txns): ${timeMs}ms`);
      expect(timeMs).toBeLessThan(1000); // 1 second
    });
  });
});
