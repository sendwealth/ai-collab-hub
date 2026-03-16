import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AgentTestingService } from '../agent-testing.service';
import { AgentTestingController } from '../agent-testing.controller';
import { AgentTestingModule } from '../agent-testing.module';
import {
  DatabaseCleanup,
  TestDataGenerator,
  TestAssertions,
  IntegrationTestHelpers,
} from '../../../test/utils/test-helpers';

describe('AgentTesting Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let service: AgentTestingService;
  let cleanup: DatabaseCleanup;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AgentTestingModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    service = app.get<AgentTestingService>(AgentTestingService);
    cleanup = new DatabaseCleanup(prisma);
  });

  afterAll(async () => {
    await cleanup.cleanAllTestData();
    await app.close();
  });

  afterEach(async () => {
    await cleanup.cleanAllTestData();
  });

  describe('Complete Test Flow', () => {
    it('should handle full test lifecycle: start → answer → submit → result', async () => {
      // 1. Seed questions
      const questions = TestDataGenerator.generateTestQuestions(5);
      await prisma.agentTestQuestion.createMany({
        data: questions,
        skipDuplicates: true,
      });

      // 2. Start test
      const agentId = 'agent-test-1';
      const startResult = await service.startTest(agentId, {
        questionCount: 3,
        type: 'all',
        category: 'all',
      });

      TestAssertions.assertHasFields(startResult, [
        'attemptId',
        'questions',
        'totalQuestions',
        'totalScore',
      ]);
      TestAssertions.assertArrayLength(startResult.questions, 3);
      expect(startResult.totalQuestions).toBe(3);

      // 3. Submit answers
      const answers = startResult.questions.map((q) => ({
        questionId: q.id,
        answer: q.expectedAnswer || 'answer',
        timeSpent: 30,
      }));

      const submitResult = await service.submitAnswers(
        agentId,
        startResult.attemptId,
        { answers },
      );

      TestAssertions.assertHasFields(submitResult, [
        'score',
        'percentage',
        'level',
        'attemptId',
      ]);
      TestAssertions.assertScoreRange(submitResult.percentage, 0, 100);
      TestAssertions.assertCertificationLevel(submitResult.level);

      // 4. Get result
      const result = await service.getResult(agentId, startResult.attemptId);

      TestAssertions.assertHasFields(result, [
        'attemptId',
        'score',
        'percentage',
        'level',
        'totalQuestions',
      ]);
      expect(result.attemptId).toBe(startResult.attemptId);
      expect(result.status).toBe('completed');
    });

    it('should persist test data correctly in database', async () => {
      const questions = TestDataGenerator.generateTestQuestions(3);
      await prisma.agentTestQuestion.createMany({
        data: questions,
        skipDuplicates: true,
      });

      const agentId = 'agent-persist-test';
      const startResult = await service.startTest(agentId, {
        questionCount: 2,
      });

      // Verify attempt was created
      const attempt = await prisma.agentTestAttempt.findUnique({
        where: { id: startResult.attemptId },
      });
      expect(attempt).toBeDefined();
      expect(attempt?.agentId).toBe(agentId);
      expect(attempt?.status).toBe('in_progress');

      // Submit answers
      const answers = startResult.questions.map((q) => ({
        questionId: q.id,
        answer: 'test answer',
        timeSpent: 30,
      }));

      await service.submitAnswers(agentId, startResult.attemptId, { answers });

      // Verify completion
      const completedAttempt = await prisma.agentTestAttempt.findUnique({
        where: { id: startResult.attemptId },
        include: { answers: true },
      });

      expect(completedAttempt?.status).toBe('completed');
      expect(completedAttempt?.answers).toHaveLength(2);
    });
  });

  describe('Database Persistence', () => {
    it('should store and retrieve test questions', async () => {
      const question = TestDataGenerator.generateTestQuestion({
        title: 'Persistence Test Question',
      });

      await prisma.agentTestQuestion.create({
        data: question,
      });

      const retrieved = await prisma.agentTestQuestion.findUnique({
        where: { id: question.id },
      });

      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe(question.title);
      expect(retrieved?.type).toBe(question.type);
    });

    it('should maintain data integrity across transactions', async () => {
      const questions = TestDataGenerator.generateTestQuestions(5);
      await prisma.agentTestQuestion.createMany({
        data: questions,
      });

      const agentId = 'agent-integrity-test';
      const startResult = await service.startTest(agentId, {
        questionCount: 3,
      });

      // Get attempt before submission
      const attemptBefore = await prisma.agentTestAttempt.findUnique({
        where: { id: startResult.attemptId },
      });
      expect(attemptBefore?.status).toBe('in_progress');

      // Submit answers
      const answers = startResult.questions.map((q) => ({
        questionId: q.id,
        answer: 'answer',
        timeSpent: 30,
      }));

      await service.submitAnswers(agentId, startResult.attemptId, {
        answers,
      });

      // Verify attempt after submission
      const attemptAfter = await prisma.agentTestAttempt.findUnique({
        where: { id: startResult.attemptId },
        include: { answers: true },
      });

      expect(attemptAfter?.status).toBe('completed');
      expect(attemptAfter?.score).not.toBeNull();
      expect(attemptAfter?.percentage).not.toBeNull();
      expect(attemptAfter?.answers).toHaveLength(3);
    });

    it('should handle concurrent test sessions correctly', async () => {
      const questions = TestDataGenerator.generateTestQuestions(10);
      await prisma.agentTestQuestion.createMany({ data: questions });

      const agents = ['agent-1', 'agent-2', 'agent-3'];

      // Start concurrent tests
      const startResults = await Promise.all(
        agents.map((agentId) =>
          service.startTest(agentId, { questionCount: 3 }),
        ),
      );

      expect(startResults).toHaveLength(3);

      // Verify all attempts were created
      const attempts = await prisma.agentTestAttempt.findMany({
        where: { agentId: { in: agents } },
      });

      expect(attempts).toHaveLength(3);
      attempts.forEach((attempt) => {
        expect(agents).toContain(attempt.agentId);
        expect(attempt.status).toBe('in_progress');
      });
    });
  });

  describe('API Response Format Validation', () => {
    it('should return consistent response format for startTest', async () => {
      const questions = TestDataGenerator.generateTestQuestions(5);
      await prisma.agentTestQuestion.createMany({ data: questions });

      const result = await service.startTest('agent-format-test', {
        questionCount: 3,
      });

      TestAssertions.assertApiResponse(result, [
        'attemptId',
        'questions',
        'totalQuestions',
        'totalScore',
        'timeLimit',
      ]);

      expect(result.questions).toBeInstanceOf(Array);
      result.questions.forEach((q: any) => {
        TestAssertions.assertApiResponse(q, [
          'id',
          'type',
          'category',
          'difficulty',
          'title',
          'description',
          'points',
        ]);
      });
    });

    it('should return consistent response format for submitAnswers', async () => {
      const questions = TestDataGenerator.generateTestQuestions(3);
      await prisma.agentTestQuestion.createMany({ data: questions });

      const startResult = await service.startTest('agent-submit-test', {
        questionCount: 2,
      });

      const answers = startResult.questions.map((q) => ({
        questionId: q.id,
        answer: 'test',
        timeSpent: 30,
      }));

      const result = await service.submitAnswers(
        'agent-submit-test',
        startResult.attemptId,
        { answers },
      );

      TestAssertions.assertApiResponse(result, [
        'attemptId',
        'score',
        'percentage',
        'level',
        'correctAnswers',
        'totalQuestions',
        'timeSpent',
        'passed',
      ]);

      TestAssertions.assertScoreRange(result.percentage);
      TestAssertions.assertCertificationLevel(result.level);
    });

    it('should return consistent response format for getResult', async () => {
      const questions = TestDataGenerator.generateTestQuestions(3);
      await prisma.agentTestQuestion.createMany({ data: questions });

      const startResult = await service.startTest('agent-result-test', {
        questionCount: 2,
      });

      const answers = startResult.questions.map((q) => ({
        questionId: q.id,
        answer: 'test',
        timeSpent: 30,
      }));

      await service.submitAnswers(
        'agent-result-test',
        startResult.attemptId,
        { answers },
      );

      const result = await service.getResult(
        'agent-result-test',
        startResult.attemptId,
      );

      TestAssertions.assertApiResponse(result, [
        'attemptId',
        'score',
        'percentage',
        'level',
        'status',
        'totalQuestions',
        'correctAnswers',
        'answers',
      ]);

      expect(result.answers).toBeInstanceOf(Array);
    });

    it('should return consistent pagination format for getHistory', async () => {
      const result = await service.getHistory('agent-history-test', 1, 20);

      TestAssertions.assertPagination(result, {
        page: 1,
        limit: 20,
        total: expect.any(Number),
      });

      expect(result.attempts).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle non-existent attempt gracefully', async () => {
      await expect(
        service.getResult('agent-error-test', 'non-existent-attempt'),
      ).rejects.toThrow();
    });

    it('should handle invalid agent ID', async () => {
      const questions = TestDataGenerator.generateTestQuestions(3);
      await prisma.agentTestQuestion.createMany({ data: questions });

      const startResult = await service.startTest('valid-agent', {
        questionCount: 2,
      });

      await expect(
        service.submitAnswers('different-agent', startResult.attemptId, {
          answers: [],
        }),
      ).rejects.toThrow();
    });

    it('should handle duplicate test submissions', async () => {
      const questions = TestDataGenerator.generateTestQuestions(3);
      await prisma.agentTestQuestion.createMany({ data: questions });

      const agentId = 'agent-duplicate-test';
      const startResult = await service.startTest(agentId, {
        questionCount: 2,
      });

      const answers = startResult.questions.map((q) => ({
        questionId: q.id,
        answer: 'test',
        timeSpent: 30,
      }));

      await service.submitAnswers(agentId, startResult.attemptId, {
        answers,
      });

      // Try to submit again
      await expect(
        service.submitAnswers(agentId, startResult.attemptId, { answers }),
      ).rejects.toThrow();
    });
  });

  describe('Performance Integration', () => {
    it('should handle large question sets efficiently', async () => {
      const questions = TestDataGenerator.generateTestQuestions(50);
      await prisma.agentTestQuestion.createMany({ data: questions });

      const { timeMs } = await IntegrationTestHelpers.measureTime(async () => {
        await service.startTest('agent-perf-test', { questionCount: 30 });
      });

      // Should complete within reasonable time
      expect(timeMs).toBeLessThan(5000); // 5 seconds
    });

    it('should handle concurrent requests without degradation', async () => {
      const questions = TestDataGenerator.generateTestQuestions(20);
      await prisma.agentTestQuestion.createMany({ data: questions });

      const { totalTimeMs, avgTimeMs } =
        await IntegrationTestHelpers.runConcurrentOperations(
          10,
          (i) => service.startTest(`agent-concurrent-${i}`, { questionCount: 5 }),
        );

      // Average time should be reasonable
      expect(avgTimeMs).toBeLessThan(1000); // 1 second per request
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistency between test attempts and answers', async () => {
      const questions = TestDataGenerator.generateTestQuestions(5);
      await prisma.agentTestQuestion.createMany({ data: questions });

      const agentId = 'agent-consistency-test';
      const startResult = await service.startTest(agentId, {
        questionCount: 3,
      });

      const answers = startResult.questions.map((q) => ({
        questionId: q.id,
        answer: 'test answer',
        timeSpent: 30,
      }));

      await service.submitAnswers(agentId, startResult.attemptId, {
        answers,
      });

      // Verify answer count matches
      const attempt = await prisma.agentTestAttempt.findUnique({
        where: { id: startResult.attemptId },
        include: { answers: true },
      });

      expect(attempt?.answers).toHaveLength(3);
      expect(attempt?.totalQuestions).toBe(3);

      // Verify score calculation
      const totalPoints = attempt?.answers.reduce(
        (sum, ans) => sum + (ans.points || 0),
        0,
      );
      expect(attempt?.score).toBe(totalPoints);
    });

    it('should correctly track test statistics', async () => {
      const agentId = 'agent-stats-test';

      // Create multiple test attempts
      const questions = TestDataGenerator.generateTestQuestions(5);
      await prisma.agentTestQuestion.createMany({ data: questions });

      for (let i = 0; i < 3; i++) {
        const startResult = await service.startTest(agentId, {
          questionCount: 3,
        });

        const answers = startResult.questions.map((q) => ({
          questionId: q.id,
          answer: 'test',
          timeSpent: 30,
        }));

        await service.submitAnswers(agentId, startResult.attemptId, {
          answers,
        });
      }

      // Get history
      const history = await service.getHistory(agentId, 1, 10);

      expect(history.total).toBe(3);
      expect(history.attempts).toHaveLength(3);

      // Verify all attempts are completed
      history.attempts.forEach((attempt) => {
        expect(attempt.status).toBe('completed');
      });
    });
  });
});
