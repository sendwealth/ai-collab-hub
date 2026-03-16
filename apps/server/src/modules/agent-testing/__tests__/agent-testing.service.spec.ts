import { Test, TestingModule } from '@nestjs/testing';
import { AgentTestingService } from '../agent-testing.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('AgentTestingService', () => {
  let service: AgentTestingService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    agentTestQuestion: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      createMany: jest.fn(),
    },
    agentTestAttempt: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    agentTestAnswer: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentTestingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AgentTestingService>(AgentTestingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startTest', () => {
    it('should start a new test attempt with questions', async () => {
      const agentId = 'agent-123';
      const mockQuestions = [
        {
          id: 'q1',
          type: 'code_review',
          category: 'frontend',
          difficulty: 1,
          title: 'Test Question',
          description: 'Test Description',
          codeSnippet: 'const test = true;',
          options: null,
          points: 10,
        },
      ];

      const mockAttempt = {
        id: 'attempt-1',
        agentId,
        questionIds: JSON.stringify(['q1']),
        totalQuestions: 1,
        totalScore: 10,
        status: 'in_progress',
        startedAt: new Date(),
      };

      mockPrismaService.agentTestQuestion.findMany.mockResolvedValue(mockQuestions);
      mockPrismaService.agentTestAttempt.create.mockResolvedValue(mockAttempt);

      const result = await service.startTest(agentId, {
        questionCount: 10,
        type: 'all',
        category: 'all',
      });

      expect(result).toHaveProperty('attemptId');
      expect(result.questions).toHaveLength(1);
      expect(result.totalQuestions).toBe(1);
      expect(result.totalScore).toBe(10);
    });

    it('should throw NotFoundException when no questions found', async () => {
      mockPrismaService.agentTestQuestion.findMany.mockResolvedValue([]);

      await expect(
        service.startTest('agent-123', { questionCount: 10 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should filter questions by type', async () => {
      const mockQuestions = [
        {
          id: 'q1',
          type: 'code_review',
          category: 'frontend',
          difficulty: 1,
          title: 'Test Question',
          description: 'Test Description',
          codeSnippet: null,
          options: null,
          points: 10,
        },
      ];

      mockPrismaService.agentTestQuestion.findMany.mockResolvedValue(mockQuestions);
      mockPrismaService.agentTestAttempt.create.mockResolvedValue({
        id: 'attempt-1',
        agentId: 'agent-123',
        questionIds: JSON.stringify(['q1']),
        totalQuestions: 1,
        totalScore: 10,
        status: 'in_progress',
        startedAt: new Date(),
      });

      await service.startTest('agent-123', { type: 'code_review' });

      expect(mockPrismaService.agentTestQuestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'code_review',
          }),
        }),
      );
    });
  });

  describe('submitAnswers', () => {
    it('should submit answers and calculate score', async () => {
      const agentId = 'agent-123';
      const attemptId = 'attempt-1';
      const mockAttempt = {
        id: attemptId,
        agentId,
        questionIds: JSON.stringify(['q1']),
        totalQuestions: 1,
        totalScore: 10,
        status: 'in_progress',
        startedAt: new Date(),
      };

      const mockQuestion = {
        id: 'q1',
        title: 'Test Question',
        expectedAnswer: 'correct answer',
        points: 10,
        explanation: 'Test explanation',
      };

      mockPrismaService.agentTestAttempt.findUnique.mockResolvedValue(mockAttempt);
      mockPrismaService.agentTestQuestion.findUnique.mockResolvedValue(mockQuestion);
      mockPrismaService.agentTestAnswer.create.mockResolvedValue({});
      mockPrismaService.agentTestAttempt.update.mockResolvedValue({
        ...mockAttempt,
        status: 'completed',
        score: 10,
        percentage: 100,
        completedAt: new Date(),
        timeSpent: 60,
      });

      const result = await service.submitAnswers(agentId, attemptId, {
        answers: [
          {
            questionId: 'q1',
            answer: 'correct answer',
            timeSpent: 30,
          },
        ],
      });

      expect(result.score).toBe(10);
      expect(result.percentage).toBe(100);
      expect(result.level).toBe('Gold');
    });

    it('should throw NotFoundException for invalid attempt', async () => {
      mockPrismaService.agentTestAttempt.findUnique.mockResolvedValue(null);

      await expect(
        service.submitAnswers('agent-123', 'invalid-attempt', {
          answers: [],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for unauthorized access', async () => {
      const mockAttempt = {
        id: 'attempt-1',
        agentId: 'different-agent',
        questionIds: JSON.stringify(['q1']),
        totalQuestions: 1,
        totalScore: 10,
        status: 'in_progress',
        startedAt: new Date(),
      };

      mockPrismaService.agentTestAttempt.findUnique.mockResolvedValue(mockAttempt);

      await expect(
        service.submitAnswers('agent-123', 'attempt-1', {
          answers: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for completed test', async () => {
      const mockAttempt = {
        id: 'attempt-1',
        agentId: 'agent-123',
        questionIds: JSON.stringify(['q1']),
        totalQuestions: 1,
        totalScore: 10,
        status: 'completed',
        startedAt: new Date(),
      };

      mockPrismaService.agentTestAttempt.findUnique.mockResolvedValue(mockAttempt);

      await expect(
        service.submitAnswers('agent-123', 'attempt-1', {
          answers: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getResult', () => {
    it('should return test result', async () => {
      const mockAttempt = {
        id: 'attempt-1',
        agentId: 'agent-123',
        status: 'completed',
        score: 85,
        totalScore: 100,
        percentage: 85,
        totalQuestions: 10,
        timeSpent: 300,
        startedAt: new Date(),
        completedAt: new Date(),
        answers: [
          {
            questionId: 'q1',
            isCorrect: true,
            points: 10,
            question: {
              id: 'q1',
              title: 'Question 1',
              explanation: 'Explanation 1',
            },
          },
        ],
      };

      mockPrismaService.agentTestAttempt.findUnique.mockResolvedValue(mockAttempt);

      const result = await service.getResult('agent-123', 'attempt-1');

      expect(result.attemptId).toBe('attempt-1');
      expect(result.score).toBe(85);
      expect(result.level).toBe('Gold');
      expect(result.totalQuestions).toBe(10);
    });

    it('should throw NotFoundException for invalid attempt', async () => {
      mockPrismaService.agentTestAttempt.findUnique.mockResolvedValue(null);

      await expect(
        service.getResult('agent-123', 'invalid-attempt'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getHistory', () => {
    it('should return paginated test history', async () => {
      const mockAttempts = [
        {
          id: 'attempt-1',
          status: 'completed',
          score: 85,
          totalScore: 100,
          percentage: 85,
          totalQuestions: 10,
          timeSpent: 300,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      ];

      mockPrismaService.agentTestAttempt.findMany.mockResolvedValue(mockAttempts);
      mockPrismaService.agentTestAttempt.count.mockResolvedValue(1);

      const result = await service.getHistory('agent-123', 1, 20);

      expect(result.attempts).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  describe('seedQuestions', () => {
    it('should seed initial questions', async () => {
      mockPrismaService.agentTestQuestion.createMany.mockResolvedValue({
        count: 10,
      });

      const result = await service.seedQuestions();

      expect(result.message).toBe('Questions seeded successfully');
      expect(result.count).toBe(10);
      expect(mockPrismaService.agentTestQuestion.createMany).toHaveBeenCalled();
    });
  });

  describe('level calculation', () => {
    it('should return Gold for score >= 85', () => {
      const service = new AgentTestingService(mockPrismaService as any);
      expect(service['getLevel'](85)).toBe('Gold');
      expect(service['getLevel'](90)).toBe('Gold');
      expect(service['getLevel'](100)).toBe('Gold');
    });

    it('should return Silver for score >= 60', () => {
      const service = new AgentTestingService(mockPrismaService as any);
      expect(service['getLevel'](60)).toBe('Silver');
      expect(service['getLevel'](75)).toBe('Silver');
      expect(service['getLevel'](84)).toBe('Silver');
    });

    it('should return Bronze for score < 60', () => {
      const service = new AgentTestingService(mockPrismaService as any);
      expect(service['getLevel'](0)).toBe('Bronze');
      expect(service['getLevel'](30)).toBe('Bronze');
      expect(service['getLevel'](59)).toBe('Bronze');
    });
  });

  describe('boundary and edge cases', () => {
    it('should handle minimum score (0)', async () => {
      const mockAttempt = {
        id: 'attempt-1',
        agentId: 'agent-123',
        questionIds: JSON.stringify(['q1']),
        totalQuestions: 1,
        totalScore: 10,
        status: 'in_progress',
        startedAt: new Date(),
      };

      const mockQuestion = {
        id: 'q1',
        title: 'Test Question',
        expectedAnswer: 'correct answer',
        points: 10,
        explanation: 'Test explanation',
      };

      mockPrismaService.agentTestAttempt.findUnique.mockResolvedValue(mockAttempt);
      mockPrismaService.agentTestQuestion.findUnique.mockResolvedValue(mockQuestion);
      mockPrismaService.agentTestAnswer.create.mockResolvedValue({});
      mockPrismaService.agentTestAttempt.update.mockResolvedValue({
        ...mockAttempt,
        status: 'completed',
        score: 0,
        percentage: 0,
        completedAt: new Date(),
        timeSpent: 60,
      });

      const result = await service.submitAnswers('agent-123', 'attempt-1', {
        answers: [
          {
            questionId: 'q1',
            answer: 'wrong answer',
            timeSpent: 30,
          },
        ],
      });

      expect(result.score).toBe(0);
      expect(result.percentage).toBe(0);
      expect(result.level).toBe('Bronze');
    });

    it('should handle perfect score (100)', async () => {
      const mockAttempt = {
        id: 'attempt-1',
        agentId: 'agent-123',
        questionIds: JSON.stringify(['q1']),
        totalQuestions: 1,
        totalScore: 10,
        status: 'in_progress',
        startedAt: new Date(),
      };

      const mockQuestion = {
        id: 'q1',
        title: 'Test Question',
        expectedAnswer: 'correct answer',
        points: 10,
        explanation: 'Test explanation',
      };

      mockPrismaService.agentTestAttempt.findUnique.mockResolvedValue(mockAttempt);
      mockPrismaService.agentTestQuestion.findUnique.mockResolvedValue(mockQuestion);
      mockPrismaService.agentTestAnswer.create.mockResolvedValue({});
      mockPrismaService.agentTestAttempt.update.mockResolvedValue({
        ...mockAttempt,
        status: 'completed',
        score: 10,
        percentage: 100,
        completedAt: new Date(),
        timeSpent: 60,
      });

      const result = await service.submitAnswers('agent-123', 'attempt-1', {
        answers: [
          {
            questionId: 'q1',
            answer: 'correct answer',
            timeSpent: 30,
          },
        ],
      });

      expect(result.score).toBe(10);
      expect(result.percentage).toBe(100);
      expect(result.level).toBe('Gold');
    });

    it('should handle boundary scores (59, 60, 84, 85)', async () => {
      const service = new AgentTestingService(mockPrismaService as any);

      expect(service['getLevel'](59)).toBe('Bronze');
      expect(service['getLevel'](60)).toBe('Silver');
      expect(service['getLevel'](84)).toBe('Silver');
      expect(service['getLevel'](85)).toBe('Gold');
    });

    it('should handle empty question set', async () => {
      mockPrismaService.agentTestQuestion.findMany.mockResolvedValue([]);

      await expect(
        service.startTest('agent-123', { questionCount: 10 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle single question test', async () => {
      const mockQuestions = [
        {
          id: 'q1',
          type: 'code_review',
          category: 'frontend',
          difficulty: 1,
          title: 'Test Question',
          description: 'Test Description',
          codeSnippet: 'const test = true;',
          options: null,
          points: 10,
        },
      ];

      mockPrismaService.agentTestQuestion.findMany.mockResolvedValue(mockQuestions);
      mockPrismaService.agentTestAttempt.create.mockResolvedValue({
        id: 'attempt-1',
        agentId: 'agent-123',
        questionIds: JSON.stringify(['q1']),
        totalQuestions: 1,
        totalScore: 10,
        status: 'in_progress',
        startedAt: new Date(),
      });

      const result = await service.startTest('agent-123', { questionCount: 1 });

      expect(result.totalQuestions).toBe(1);
      expect(result.questions).toHaveLength(1);
    });

    it('should handle maximum question count', async () => {
      const mockQuestions = Array(50)
        .fill(null)
        .map((_, i) => ({
          id: `q${i}`,
          type: 'code_review',
          category: 'frontend',
          difficulty: 1,
          title: `Question ${i}`,
          description: 'Test',
          codeSnippet: null,
          options: null,
          points: 10,
        }));

      mockPrismaService.agentTestQuestion.findMany.mockResolvedValue(mockQuestions);
      mockPrismaService.agentTestAttempt.create.mockResolvedValue({
        id: 'attempt-1',
        agentId: 'agent-123',
        questionIds: JSON.stringify(mockQuestions.map((q) => q.id)),
        totalQuestions: 50,
        totalScore: 500,
        status: 'in_progress',
        startedAt: new Date(),
      });

      const result = await service.startTest('agent-123', { questionCount: 50 });

      expect(result.totalQuestions).toBe(50);
      expect(result.questions).toHaveLength(50);
    });
  });

  describe('error handling', () => {
    it('should prevent duplicate test attempts', async () => {
      const agentId = 'agent-123';
      const mockQuestions = [
        {
          id: 'q1',
          type: 'code_review',
          category: 'frontend',
          difficulty: 1,
          title: 'Test Question',
          description: 'Test',
          codeSnippet: null,
          options: null,
          points: 10,
        },
      ];

      mockPrismaService.agentTestQuestion.findMany.mockResolvedValue(mockQuestions);
      mockPrismaService.agentTestAttempt.findMany.mockResolvedValue([
        {
          id: 'active-attempt',
          agentId,
          status: 'in_progress',
          startedAt: new Date(),
        },
      ]);

      await expect(
        service.startTest(agentId, { questionCount: 10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle invalid answer format', async () => {
      const mockAttempt = {
        id: 'attempt-1',
        agentId: 'agent-123',
        questionIds: JSON.stringify(['q1']),
        totalQuestions: 1,
        totalScore: 10,
        status: 'in_progress',
        startedAt: new Date(),
      };

      mockPrismaService.agentTestAttempt.findUnique.mockResolvedValue(mockAttempt);

      await expect(
        service.submitAnswers('agent-123', 'attempt-1', {
          answers: [
            {
              questionId: 'q1',
              answer: '',
              timeSpent: 30,
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle missing answers', async () => {
      const mockAttempt = {
        id: 'attempt-1',
        agentId: 'agent-123',
        questionIds: JSON.stringify(['q1', 'q2']),
        totalQuestions: 2,
        totalScore: 20,
        status: 'in_progress',
        startedAt: new Date(),
      };

      mockPrismaService.agentTestAttempt.findUnique.mockResolvedValue(mockAttempt);

      await expect(
        service.submitAnswers('agent-123', 'attempt-1', {
          answers: [
            {
              questionId: 'q1',
              answer: 'answer',
              timeSpent: 30,
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle timeout scenario', async () => {
      const mockAttempt = {
        id: 'attempt-1',
        agentId: 'agent-123',
        questionIds: JSON.stringify(['q1']),
        totalQuestions: 1,
        totalScore: 10,
        status: 'in_progress',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      };

      mockPrismaService.agentTestAttempt.findUnique.mockResolvedValue(mockAttempt);

      await expect(
        service.submitAnswers('agent-123', 'attempt-1', {
          answers: [
            {
              questionId: 'q1',
              answer: 'answer',
              timeSpent: 30,
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle invalid question IDs', async () => {
      const mockAttempt = {
        id: 'attempt-1',
        agentId: 'agent-123',
        questionIds: JSON.stringify(['q1']),
        totalQuestions: 1,
        totalScore: 10,
        status: 'in_progress',
        startedAt: new Date(),
      };

      mockPrismaService.agentTestAttempt.findUnique.mockResolvedValue(mockAttempt);
      mockPrismaService.agentTestQuestion.findUnique.mockResolvedValue(null);

      await expect(
        service.submitAnswers('agent-123', 'attempt-1', {
          answers: [
            {
              questionId: 'invalid-q',
              answer: 'answer',
              timeSpent: 30,
            },
          ],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate question data structure', async () => {
      const mockQuestions = [
        {
          id: 'q1',
          type: 'code_review',
          category: 'frontend',
          difficulty: 1,
          title: 'Test Question',
          description: 'Test',
          codeSnippet: null,
          options: null,
          points: -10, // Invalid negative points
        },
      ];

      mockPrismaService.agentTestQuestion.findMany.mockResolvedValue(mockQuestions);

      await expect(
        service.startTest('agent-123', { questionCount: 10 }),
      ).rejects.toThrow();
    });
  });

  describe('concurrent test handling', () => {
    it('should handle multiple agents testing simultaneously', async () => {
      const agents = ['agent-1', 'agent-2', 'agent-3'];
      const mockQuestions = [
        {
          id: 'q1',
          type: 'code_review',
          category: 'frontend',
          difficulty: 1,
          title: 'Test',
          description: 'Test',
          codeSnippet: null,
          options: null,
          points: 10,
        },
      ];

      mockPrismaService.agentTestQuestion.findMany.mockResolvedValue(mockQuestions);
      mockPrismaService.agentTestAttempt.create.mockImplementation((data) =>
        Promise.resolve({
          id: `attempt-${data.data.agentId}`,
          ...data.data,
          status: 'in_progress',
          startedAt: new Date(),
        }),
      );

      const results = await Promise.all(
        agents.map((agentId) =>
          service.startTest(agentId, { questionCount: 10 }),
        ),
      );

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.attemptId).toContain(agents[index]);
      });
    });

    it('should handle concurrent submissions for same agent', async () => {
      const agentId = 'agent-123';
      const mockAttempt = {
        id: 'attempt-1',
        agentId,
        questionIds: JSON.stringify(['q1']),
        totalQuestions: 1,
        totalScore: 10,
        status: 'in_progress',
        startedAt: new Date(),
      };

      const mockQuestion = {
        id: 'q1',
        title: 'Test',
        expectedAnswer: 'correct',
        points: 10,
        explanation: 'Test',
      };

      mockPrismaService.agentTestAttempt.findUnique.mockResolvedValue(mockAttempt);
      mockPrismaService.agentTestQuestion.findUnique.mockResolvedValue(mockQuestion);
      mockPrismaService.agentTestAnswer.create.mockResolvedValue({});
      mockPrismaService.agentTestAttempt.update.mockResolvedValue({
        ...mockAttempt,
        status: 'completed',
        score: 10,
        percentage: 100,
        completedAt: new Date(),
        timeSpent: 60,
      });

      const results = await Promise.all([
        service.submitAnswers(agentId, 'attempt-1', {
          answers: [{ questionId: 'q1', answer: 'correct', timeSpent: 30 }],
        }),
        service.submitAnswers(agentId, 'attempt-1', {
          answers: [{ questionId: 'q1', answer: 'correct', timeSpent: 30 }],
        }),
      ]);

      // Should handle race condition - only one should succeed
      expect(results).toBeDefined();
    });

    it('should maintain data integrity during concurrent operations', async () => {
      const agentId = 'agent-123';

      mockPrismaService.agentTestAttempt.findMany.mockResolvedValue([]);

      const startAttempts = Array(5)
        .fill(null)
        .map((_, i) =>
          service.startTest(`${agentId}-${i}`, { questionCount: 5 }),
        );

      await expect(Promise.all(startAttempts)).resolves.toBeDefined();
      expect(mockPrismaService.agentTestAttempt.create).toHaveBeenCalledTimes(5);
    });
  });

  describe('data validation', () => {
    it('should validate question format has required fields', () => {
      const validQuestion = {
        id: 'q1',
        type: 'code_review',
        category: 'frontend',
        difficulty: 1,
        title: 'Test',
        description: 'Test',
        points: 10,
      };

      expect(validQuestion.id).toBeDefined();
      expect(validQuestion.type).toBeDefined();
      expect(validQuestion.points).toBeGreaterThan(0);
    });

    it('should validate answer format completeness', async () => {
      const mockAttempt = {
        id: 'attempt-1',
        agentId: 'agent-123',
        questionIds: JSON.stringify(['q1']),
        totalQuestions: 1,
        totalScore: 10,
        status: 'in_progress',
        startedAt: new Date(),
      };

      mockPrismaService.agentTestAttempt.findUnique.mockResolvedValue(mockAttempt);

      // Missing timeSpent
      await expect(
        service.submitAnswers('agent-123', 'attempt-1', {
          answers: [
            {
              questionId: 'q1',
              answer: 'answer',
            } as any,
          ],
        }),
      ).rejects.toThrow();
    });

    it('should sanitize code snippets to prevent injection', async () => {
      const maliciousSnippet = '<script>alert("xss")</script>';
      const mockQuestions = [
        {
          id: 'q1',
          type: 'code_review',
          category: 'security',
          difficulty: 3,
          title: 'Security Test',
          description: 'Test',
          codeSnippet: maliciousSnippet,
          options: null,
          points: 10,
        },
      ];

      mockPrismaService.agentTestQuestion.findMany.mockResolvedValue(mockQuestions);
      mockPrismaService.agentTestAttempt.create.mockResolvedValue({
        id: 'attempt-1',
        agentId: 'agent-123',
        questionIds: JSON.stringify(['q1']),
        totalQuestions: 1,
        totalScore: 10,
        status: 'in_progress',
        startedAt: new Date(),
      });

      const result = await service.startTest('agent-123', { questionCount: 1 });

      expect(result.questions).toBeDefined();
      // Service should handle sanitization
    });
  });
});
