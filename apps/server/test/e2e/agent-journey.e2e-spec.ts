import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/modules/common/prisma/prisma.service';
import { AppModule } from '../../src/app.module';
import {
  DatabaseCleanup,
  TestDataGenerator,
  TestAssertions,
  PerformanceTestUtils,
} from '../utils/test-helpers';

describe('Agent Journey E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cleanup: DatabaseCleanup;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    cleanup = new DatabaseCleanup(prisma);
  });

  afterAll(async () => {
    await cleanup.cleanAllTestData();
    await app.close();
  });

  afterEach(async () => {
    await cleanup.cleanAllTestData();
  });

  describe('Complete Agent Onboarding Journey', () => {
    it('should handle full agent lifecycle: register → test → certify → deposit → work', async () => {
      // Step 1: Agent Registration
      const agentData = {
        name: 'Test Agent Journey',
        description: 'E2E test agent',
        capabilities: ['coding', 'testing'],
        version: '1.0.0',
        status: 'active',
      };

      const registerResponse = await request(app.getHttpServer())
        .post('/agents')
        .send(agentData)
        .expect(201);

      const agent = registerResponse.body;
      TestAssertions.assertHasFields(agent, [
        'id',
        'name',
        'capabilities',
        'status',
        'createdAt',
      ]);

      const agentId = agent.id;

      // Step 2: Take Capability Test
      const testStartResponse = await request(app.getHttpServer())
        .post(`/agent-testing/${agentId}/start`)
        .send({
          questionCount: 5,
          type: 'all',
          category: 'all',
        })
        .expect(201);

      const testStart = testStartResponse.body;
      TestAssertions.assertHasFields(testStart, [
        'attemptId',
        'questions',
        'totalQuestions',
        'totalScore',
      ]);

      expect(testStart.questions).toHaveLength(5);

      // Step 3: Submit Test Answers
      const answers = testStart.questions.map((q: any) => ({
        questionId: q.id,
        answer: q.expectedAnswer || 'test answer',
        timeSpent: 30,
      }));

      const testSubmitResponse = await request(app.getHttpServer())
        .post(`/agent-testing/${agentId}/submit/${testStart.attemptId}`)
        .send({ answers })
        .expect(201);

      const testResult = testSubmitResponse.body;
      TestAssertions.assertHasFields(testResult, [
        'score',
        'percentage',
        'level',
        'passed',
      ]);

      TestAssertions.assertScoreRange(testResult.percentage);
      TestAssertions.assertCertificationLevel(testResult.level);

      // Step 4: Get Certification
      const certResponse = await request(app.getHttpServer())
        .get(`/agent-certification/${agentId}`)
        .expect(200);

      const certification = certResponse.body;
      TestAssertions.assertHasFields(certification, [
        'certificationId',
        'level',
        'score',
        'badgeUrl',
      ]);

      TestAssertions.assertCertificationLevel(certification.level);

      // Step 5: Make Deposit
      const depositResponse = await request(app.getHttpServer())
        .post(`/deposit/${agentId}/deposit`)
        .send({
          amount: 1000,
          description: 'Initial deposit',
        })
        .expect(201);

      const deposit = depositResponse.body;
      TestAssertions.assertHasFields(deposit, [
        'transactionId',
        'amount',
        'newBalance',
      ]);

      expect(deposit.newBalance).toBe(1000);

      // Step 6: Freeze Deposit for Task
      const freezeResponse = await request(app.getHttpServer())
        .post(`/deposit/${agentId}/freeze`)
        .send({
          amount: 300,
          reason: 'Task reservation',
        })
        .expect(201);

      const freeze = freezeResponse.body;
      expect(freeze.frozenAmount).toBe(300);
      expect(freeze.availableBalance).toBe(700);

      // Step 7: Verify Complete Agent Status
      const statusResponse = await request(app.getHttpServer())
        .get(`/agents/${agentId}`)
        .expect(200);

      const agentStatus = statusResponse.body;
      expect(agentStatus.id).toBe(agentId);
      expect(agentStatus.status).toBe('active');

      // Step 8: Check Leaderboard Position
      const leaderboardResponse = await request(app.getHttpServer())
        .get('/agent-certification/leaderboard')
        .query({ limit: 10, page: 1 })
        .expect(200);

      const leaderboard = leaderboardResponse.body;
      expect(leaderboard.leaderboard).toBeInstanceOf(Array);

      // Verify agent appears on leaderboard
      const agentRank = leaderboard.leaderboard.find(
        (entry: any) => entry.agentId === agentId,
      );
      expect(agentRank).toBeDefined();
    });

    it('should handle agent re-certification journey', async () => {
      const agentId = 'agent-recert-journey';

      // Initial registration and testing
      await request(app.getHttpServer())
        .post('/agents')
        .send({
          id: agentId,
          name: 'Recert Agent',
          capabilities: ['coding'],
          version: '1.0.0',
          status: 'active',
        })
        .expect(201);

      // Take initial test - score 65 (Silver)
      const questions = await prisma.agentTestQuestion.findMany({ take: 3 });
      await prisma.agentTestQuestion.createMany({
        data: TestDataGenerator.generateTestQuestions(5),
        skipDuplicates: true,
      });

      const testStart = await request(app.getHttpServer())
        .post(`/agent-testing/${agentId}/start`)
        .send({ questionCount: 3 })
        .expect(201);

      const answers = testStart.body.questions.map((q: any) => ({
        questionId: q.id,
        answer: 'partial answer',
        timeSpent: 30,
      }));

      await request(app.getHttpServer())
        .post(`/agent-testing/${agentId}/submit/${testStart.body.attemptId}`)
        .send({ answers })
        .expect(201);

      // Check initial certification
      const initialCert = await request(app.getHttpServer())
        .get(`/agent-certification/${agentId}`)
        .expect(200);

      expect(initialCert.body.level).toBe('bronze' || 'silver');

      // Retake test and improve to 90 (Gold)
      const testRetake = await request(app.getHttpServer())
        .post(`/agent-testing/${agentId}/start`)
        .send({ questionCount: 3 })
        .expect(201);

      const betterAnswers = testRetake.body.questions.map((q: any) => ({
        questionId: q.id,
        answer: q.expectedAnswer || 'correct answer',
        timeSpent: 25,
      }));

      await request(app.getHttpServer())
        .post(`/agent-testing/${agentId}/submit/${testRetake.body.attemptId}`)
        .send({ answers: betterAnswers })
        .expect(201);

      // Verify level up
      const upgradedCert = await request(app.getHttpServer())
        .get(`/agent-certification/${agentId}`)
        .expect(200);

      expect(upgradedCert.body.level).toBe('silver' || 'gold');
      expect(upgradedCert.body.bestScore).toBeGreaterThan(
        initialCert.body.bestScore,
      );
    });
  });

  describe('Multi-Agent Collaboration Journey', () => {
    it('should handle two agents working on same task', async () => {
      // Create two agents
      const agent1Response = await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: 'Agent One',
          capabilities: ['coding'],
          version: '1.0.0',
          status: 'active',
        })
        .expect(201);

      const agent2Response = await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: 'Agent Two',
          capabilities: ['testing'],
          version: '1.0.0',
          status: 'active',
        })
        .expect(201);

      const agent1Id = agent1Response.body.id;
      const agent2Id = agent2Response.body.id;

      // Both agents get certified
      await request(app.getHttpServer())
        .post(`/agent-testing/${agent1Id}/start`)
        .send({ questionCount: 3 });

      await request(app.getHttpServer())
        .post(`/agent-testing/${agent2Id}/start`)
        .send({ questionCount: 3 });

      // Both make deposits
      await request(app.getHttpServer())
        .post(`/deposit/${agent1Id}/deposit`)
        .send({ amount: 500 });

      await request(app.getHttpServer())
        .post(`/deposit/${agent2Id}/deposit`)
        .send({ amount: 500 });

      // Verify both agents are active and have balances
      const agent1Status = await request(app.getHttpServer())
        .get(`/agents/${agent1Id}`)
        .expect(200);

      const agent2Status = await request(app.getHttpServer())
        .get(`/agents/${agent2Id}`)
        .expect(200);

      expect(agent1Status.body.status).toBe('active');
      expect(agent2Status.body.status).toBe('active');

      // Check leaderboard includes both
      const leaderboard = await request(app.getHttpServer())
        .get('/agent-certification/leaderboard')
        .expect(200);

      const agent1Entry = leaderboard.body.leaderboard.find(
        (e: any) => e.agentId === agent1Id,
      );
      const agent2Entry = leaderboard.body.leaderboard.find(
        (e: any) => e.agentId === agent2Id,
      );

      expect(agent1Entry).toBeDefined();
      expect(agent2Entry).toBeDefined();
    });
  });

  describe('Agent Progression Journey', () => {
    it('should track agent progression from Bronze to Gold', async () => {
      const agentId = 'agent-progression-journey';

      await request(app.getHttpServer())
        .post('/agents')
        .send({
          id: agentId,
          name: 'Progressive Agent',
          capabilities: ['coding'],
          version: '1.0.0',
        })
        .expect(201);

      // Seed questions
      await prisma.agentTestQuestion.createMany({
        data: TestDataGenerator.generateTestQuestions(10),
        skipDuplicates: true,
      });

      // Initial state - Bronze
      const initialCert = await request(app.getHttpServer())
        .get(`/agent-certification/${agentId}`)
        .expect(200);

      expect(initialCert.body.level).toBe('bronze');

      // Take test - improve to Silver
      const test1 = await request(app.getHttpServer())
        .post(`/agent-testing/${agentId}/start`)
        .send({ questionCount: 5 })
        .expect(201);

      const answers1 = test1.body.questions.map((q: any) => ({
        questionId: q.id,
        answer: q.expectedAnswer || 'good answer',
        timeSpent: 30,
      }));

      await request(app.getHttpServer())
        .post(`/agent-testing/${agentId}/submit/${test1.body.attemptId}`)
        .send({ answers: answers1 })
        .expect(201);

      // Complete tasks to improve score
      await prisma.agentCertification.update({
        where: { agentId },
        data: {
          tasksCompleted: 20,
          avgRating: 4.5,
        },
      });

      // Check progression
      const afterTasks = await request(app.getHttpServer())
        .get(`/agent-certification/${agentId}`)
        .expect(200);

      expect(afterTasks.body.tasksCompleted).toBe(20);

      // Take another test - reach Gold
      const test2 = await request(app.getHttpServer())
        .post(`/agent-testing/${agentId}/start`)
        .send({ questionCount: 5 })
        .expect(201);

      const answers2 = test2.body.questions.map((q: any) => ({
        questionId: q.id,
        answer: q.expectedAnswer || 'excellent answer',
        timeSpent: 25,
      }));

      await request(app.getHttpServer())
        .post(`/agent-testing/${agentId}/submit/${test2.body.attemptId}`)
        .send({ answers: answers2 })
        .expect(201);

      // Verify Gold level
      const finalCert = await request(app.getHttpServer())
        .get(`/agent-certification/${agentId}`)
        .expect(200);

      expect(finalCert.body.level).toBe('gold');
      expect(finalCert.body.badgeUrl).toContain('gold');
    });
  });

  describe('Error Recovery Journey', () => {
    it('should handle and recover from various errors', async () => {
      const agentId = 'agent-error-recovery';

      await request(app.getHttpServer())
        .post('/agents')
        .send({
          id: agentId,
          name: 'Resilient Agent',
          capabilities: ['coding'],
        })
        .expect(201);

      // Try to get non-existent certification - should create bronze
      await request(app.getHttpServer())
        .get(`/agent-certification/${agentId}`)
        .expect(200);

      // Try to deposit negative amount - should fail
      await request(app.getHttpServer())
        .post(`/deposit/${agentId}/deposit`)
        .send({ amount: -100 })
        .expect(400);

      // Deposit valid amount
      await request(app.getHttpServer())
        .post(`/deposit/${agentId}/deposit`)
        .send({ amount: 500 })
        .expect(201);

      // Try to deduct more than balance - should fail
      await request(app.getHttpServer())
        .post(`/deposit/${agentId}/deduct`)
        .send({
          amount: 1000,
          reason: 'quality',
          taskId: 'task-1',
        })
        .expect(400);

      // Deduct valid amount
      await request(app.getHttpServer())
        .post(`/deposit/${agentId}/deduct`)
        .send({
          amount: 200,
          reason: 'quality',
          taskId: 'task-1',
        })
        .expect(201);

      // Verify system recovered correctly
      const balance = await request(app.getHttpServer())
        .get(`/deposit/${agentId}/balance`)
        .expect(200);

      expect(balance.body.balance).toBe(300);
    });
  });

  describe('Performance Journey', () => {
    it('should handle complete journey within acceptable time', async () => {
      const agentId = 'agent-perf-journey';

      const { totalTimeMs } = await PerformanceTestUtils.measureTime(async () => {
        // Register
        await request(app.getHttpServer())
          .post('/agents')
          .send({
            id: agentId,
            name: 'Fast Agent',
            capabilities: ['coding'],
          })
          .expect(201);

        // Get certified
        await request(app.getHttpServer())
          .get(`/agent-certification/${agentId}`)
          .expect(200);

        // Deposit
        await request(app.getHttpServer())
          .post(`/deposit/${agentId}/deposit`)
          .send({ amount: 1000 })
          .expect(201);

        // Freeze
        await request(app.getHttpServer())
          .post(`/deposit/${agentId}/freeze`)
          .send({ amount: 300 })
          .expect(201);

        // Deduct
        await request(app.getHttpServer())
          .post(`/deposit/${agentId}/deduct`)
          .send({
            amount: 100,
            reason: 'quality',
            taskId: 'task-1',
          })
          .expect(201);
      });

      // Complete journey should take less than 2 seconds
      expect(totalTimeMs).toBeLessThan(2000);
    });
  });
});
