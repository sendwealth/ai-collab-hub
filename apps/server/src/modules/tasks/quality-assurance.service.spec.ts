import { Test, TestingModule } from '@nestjs/testing';
import { QualityAssuranceService } from './quality-assurance.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('QualityAssuranceService (TDD)', () => {
  let service: QualityAssuranceService;
  let prisma: PrismaService;

  const mockPrismaService = {
    task: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    qualityChecklist: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    qualityReview: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    automatedTest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualityAssuranceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<QualityAssuranceService>(QualityAssuranceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Quality Checklist Management', () => {
    describe('createChecklistItem', () => {
      it('should create a checklist item successfully', async () => {
        const taskId = 'task-id';
        const createDto = {
          name: 'Code Review',
          description: 'Review code changes',
          required: true,
        };

        mockPrismaService.task.findUnique.mockResolvedValue({
          id: taskId,
          status: 'open',
        });

        mockPrismaService.qualityChecklist.create.mockResolvedValue({
          id: 'checklist-id',
          ...createDto,
          taskId,
          completed: false,
          order: 1,
        });

        const result = await service.createChecklistItem(taskId, createDto);

        expect(result.name).toBe(createDto.name);
        expect(result.required).toBe(true);
        expect(result.completed).toBe(false);
      });

      it('should throw NotFoundException if task not found', async () => {
        mockPrismaService.task.findUnique.mockResolvedValue(null);

        await expect(
          service.createChecklistItem('invalid-id', { name: 'Test' }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('getChecklist', () => {
      it('should return all checklist items for a task', async () => {
        const taskId = 'task-id';
        const items = [
          { id: 'item-1', name: 'Code Review', completed: true },
          { id: 'item-2', name: 'Tests Passed', completed: false },
        ];

        mockPrismaService.qualityChecklist.findMany.mockResolvedValue(items);

        const result = await service.getChecklist(taskId);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Code Review');
      });
    });

    describe('updateChecklistItem', () => {
      it('should update checklist item status', async () => {
        const itemId = 'item-id';
        const updateDto = {
          completed: true,
          completedBy: 'agent-id',
        };

        mockPrismaService.qualityChecklist.findUnique.mockResolvedValue({
          id: itemId,
          taskId: 'task-id',
        });

        mockPrismaService.qualityChecklist.update.mockResolvedValue({
          id: itemId,
          ...updateDto,
          completedAt: expect.any(Date),
        });

        const result = await service.updateChecklistItem(itemId, updateDto);

        expect(result.completed).toBe(true);
        expect(result.completedBy).toBe('agent-id');
      });
    });

    describe('validateChecklist', () => {
      it('should return true if all required items are completed', async () => {
        const taskId = 'task-id';

        mockPrismaService.qualityChecklist.findMany.mockResolvedValue([
          { id: 'item-1', required: true, completed: true },
          { id: 'item-2', required: true, completed: true },
          { id: 'item-3', required: false, completed: false },
        ]);

        const result = await service.validateChecklist(taskId);

        expect(result.valid).toBe(true);
        expect(result.missingItems).toHaveLength(0);
      });

      it('should return false if required items are not completed', async () => {
        const taskId = 'task-id';

        mockPrismaService.qualityChecklist.findMany.mockResolvedValue([
          { id: 'item-1', required: true, completed: true },
          { id: 'item-2', required: true, completed: false },
          { id: 'item-3', required: false, completed: false },
        ]);

        const result = await service.validateChecklist(taskId);

        expect(result.valid).toBe(false);
        expect(result.missingItems).toHaveLength(1);
        expect(result.missingItems[0]).toBe('item-2');
      });
    });
  });

  describe('Quality Review Management', () => {
    describe('submitReview', () => {
      it('should submit a quality review successfully', async () => {
        const taskId = 'task-id';
        const submitDto = {
          reviewerId: 'reviewer-id',
          checklist: { item1: true, item2: true },
          feedback: 'Good work!',
          rating: 4,
        };

        mockPrismaService.task.findUnique.mockResolvedValue({
          id: taskId,
          status: 'reviewing',
        });

        mockPrismaService.qualityReview.create.mockResolvedValue({
          id: 'review-id',
          ...submitDto,
          status: 'PENDING',
          createdAt: new Date(),
        });

        const result = await service.submitReview(taskId, submitDto);

        expect(result.status).toBe('PENDING');
        expect(result.rating).toBe(4);
      });

      it('should throw BadRequestException if task is not in reviewing status', async () => {
        mockPrismaService.task.findUnique.mockResolvedValue({
          id: 'task-id',
          status: 'open',
        });

        await expect(
          service.submitReview('task-id', {
            reviewerId: 'reviewer-id',
            checklist: {},
          }),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('getReviews', () => {
      it('should return all reviews for a task', async () => {
        const taskId = 'task-id';
        const reviews = [
          { id: 'review-1', status: 'APPROVED', rating: 5 },
          { id: 'review-2', status: 'NEEDS_REVISION', rating: 3 },
        ];

        mockPrismaService.qualityReview.findMany.mockResolvedValue(reviews);

        const result = await service.getReviews(taskId);

        expect(result).toHaveLength(2);
        expect(result[0].status).toBe('APPROVED');
      });
    });

    describe('approveReview', () => {
      it('should approve a review and update task status', async () => {
        const reviewId = 'review-id';

        mockPrismaService.qualityReview.findUnique.mockResolvedValue({
          id: reviewId,
          taskId: 'task-id',
          status: 'PENDING',
        });

        mockPrismaService.qualityReview.update.mockResolvedValue({
          id: reviewId,
          status: 'APPROVED',
          reviewedAt: expect.any(Date),
        });

        mockPrismaService.task.update.mockResolvedValue({
          id: 'task-id',
          status: 'completed',
        });

        const result = await service.approveReview(reviewId);

        expect(result.status).toBe('APPROVED');
      });
    });

    describe('rejectReview', () => {
      it('should reject a review with feedback', async () => {
        const reviewId = 'review-id';
        const feedback = 'Needs more testing';

        mockPrismaService.qualityReview.findUnique.mockResolvedValue({
          id: reviewId,
          taskId: 'task-id',
          status: 'PENDING',
        });

        mockPrismaService.qualityReview.update.mockResolvedValue({
          id: reviewId,
          status: 'REJECTED',
          feedback,
          reviewedAt: expect.any(Date),
        });

        const result = await service.rejectReview(reviewId, feedback);

        expect(result.status).toBe('REJECTED');
        expect(result.feedback).toBe(feedback);
      });
    });

    describe('calculateQualityScore', () => {
      it('should calculate quality score from reviews', async () => {
        const taskId = 'task-id';

        mockPrismaService.qualityReview.findMany.mockResolvedValue([
          { rating: 5 },
          { rating: 4 },
          { rating: 4 },
        ]);

        const result = await service.calculateQualityScore(taskId);

        expect(result.score).toBe(4.33);
        expect(result.count).toBe(3);
      });
    });
  });

  describe('Automated Test Management', () => {
    describe('createAutomatedTest', () => {
      it('should create an automated test configuration', async () => {
        const taskId = 'task-id';
        const createDto = {
          type: 'UNIT_TEST',
          config: {
            coverage: 80,
            timeout: 30000,
          },
        };

        mockPrismaService.task.findUnique.mockResolvedValue({
          id: taskId,
        });

        mockPrismaService.automatedTest.create.mockResolvedValue({
          id: 'test-id',
          ...createDto,
          status: 'PENDING',
        });

        const result = await service.createAutomatedTest(taskId, createDto);

        expect(result.type).toBe('UNIT_TEST');
        expect(result.status).toBe('PENDING');
      });
    });

    describe('getAutomatedTests', () => {
      it('should return all automated tests for a task', async () => {
        const taskId = 'task-id';
        const tests = [
          { id: 'test-1', type: 'UNIT_TEST', status: 'PASSED' },
          { id: 'test-2', type: 'CODE_QUALITY', status: 'FAILED' },
        ];

        mockPrismaService.automatedTest.findMany.mockResolvedValue(tests);

        const result = await service.getAutomatedTests(taskId);

        expect(result).toHaveLength(2);
        expect(result[0].status).toBe('PASSED');
      });
    });

    describe('updateTestResult', () => {
      it('should update test result after execution', async () => {
        const testId = 'test-id';
        const result = {
          status: 'PASSED',
          result: {
            passed: 10,
            failed: 0,
            coverage: 85,
          },
        };

        mockPrismaService.automatedTest.findUnique.mockResolvedValue({
          id: testId,
          status: 'RUNNING',
        });

        mockPrismaService.automatedTest.update.mockResolvedValue({
          id: testId,
          ...result,
          executedAt: expect.any(Date),
        });

        const updated = await service.updateTestResult(testId, result);

        expect(updated.status).toBe('PASSED');
        expect(updated.result.coverage).toBe(85);
      });
    });

    describe('runAutomatedTests', () => {
      it('should run all pending tests for a task', async () => {
        const taskId = 'task-id';

        mockPrismaService.automatedTest.findMany.mockResolvedValue([
          { id: 'test-1', type: 'UNIT_TEST', status: 'PENDING' },
          { id: 'test-2', type: 'CODE_QUALITY', status: 'PENDING' },
        ]);

        mockPrismaService.automatedTest.update.mockResolvedValue({
          status: 'RUNNING',
        });

        const result = await service.runAutomatedTests(taskId);

        expect(result.totalTests).toBe(2);
        expect(result.started).toBe(true);
      });
    });

    describe('getTestSummary', () => {
      it('should return test summary for a task', async () => {
        const taskId = 'task-id';

        mockPrismaService.automatedTest.count
          .mockResolvedValueOnce(5) // total
          .mockResolvedValueOnce(3) // passed
          .mockResolvedValueOnce(1) // failed
          .mockResolvedValueOnce(1); // pending

        const result = await service.getTestSummary(taskId);

        expect(result.total).toBe(5);
        expect(result.passed).toBe(3);
        expect(result.failed).toBe(1);
        expect(result.pending).toBe(1);
      });
    });
  });

  describe('Quality Assurance Workflow', () => {
    describe('startQAProcess', () => {
      it('should start QA process for a task', async () => {
        const taskId = 'task-id';

        mockPrismaService.task.findUnique.mockResolvedValue({
          id: taskId,
          status: 'assigned',
        });

        mockPrismaService.qualityChecklist.findMany.mockResolvedValue([
          { id: 'item-1', required: true, completed: true },
          { id: 'item-2', required: true, completed: true },
        ]);

        mockPrismaService.task.update.mockResolvedValue({
          id: taskId,
          status: 'reviewing',
        });

        const result = await service.startQAProcess(taskId);

        expect(result.status).toBe('reviewing');
        expect(result.checklistValid).toBe(true);
      });

      it('should fail if checklist is not complete', async () => {
        const taskId = 'task-id';

        mockPrismaService.task.findUnique.mockResolvedValue({
          id: taskId,
          status: 'assigned',
        });

        mockPrismaService.qualityChecklist.findMany.mockResolvedValue([
          { id: 'item-1', required: true, completed: true },
          { id: 'item-2', required: true, completed: false },
        ]);

        await expect(service.startQAProcess(taskId)).rejects.toThrow(
          BadRequestException,
        );
      });
    });

    describe('getQAStatus', () => {
      it('should return comprehensive QA status', async () => {
        const taskId = 'task-id';

        mockPrismaService.task.findUnique.mockResolvedValue({
          id: taskId,
          status: 'reviewing',
        });

        mockPrismaService.qualityChecklist.count
          .mockResolvedValueOnce(5) // total
          .mockResolvedValueOnce(4); // completed

        mockPrismaService.qualityReview.findMany.mockResolvedValue([
          { status: 'PENDING' },
        ]);

        mockPrismaService.automatedTest.count
          .mockResolvedValueOnce(3) // total
          .mockResolvedValueOnce(2); // passed

        const result = await service.getQAStatus(taskId);

        expect(result.taskStatus).toBe('reviewing');
        expect(result.checklistProgress).toBe(80);
        expect(result.reviewStatus).toBe('PENDING');
        expect(result.testPassRate).toBe(66.67);
      });
    });
  });

  describe('Dispute Resolution', () => {
    describe('createDispute', () => {
      it('should create a dispute for rejected review', async () => {
        const reviewId = 'review-id';
        const createDto = {
          reason: 'Unfair rejection',
          evidence: 'Test results show all tests passed',
        };

        mockPrismaService.qualityReview.findUnique.mockResolvedValue({
          id: reviewId,
          status: 'REJECTED',
        });

        const result = await service.createDispute(reviewId, createDto);

        expect(result.status).toBe('DISPUTED');
        expect(result.disputeReason).toBe(createDto.reason);
      });

      it('should throw BadRequestException for non-rejected review', async () => {
        mockPrismaService.qualityReview.findUnique.mockResolvedValue({
          id: 'review-id',
          status: 'APPROVED',
        });

        await expect(
          service.createDispute('review-id', { reason: 'Test' }),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });
});
