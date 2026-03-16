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
});
