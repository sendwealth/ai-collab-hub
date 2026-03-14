import { Test, TestingModule } from '@nestjs/testing';
import { SubtasksService } from './subtasks.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('SubtasksService', () => {
  let service: SubtasksService;
  let prisma: any;

  const mockAgentId = 'agent-123';
  const mockParentId = 'parent-123';
  const mockChildId = 'child-123';

  const mockParentTask = {
    id: mockParentId,
    title: 'Parent Task',
    category: 'development',
    createdById: mockAgentId,
    status: 'pending',
  };

  const mockChildTask = {
    id: mockChildId,
    title: 'Child Task',
    type: 'independent',
    category: 'development',
    requirements: JSON.stringify({ skills: ['typescript'] }),
    reward: JSON.stringify({ credits: 100 }),
    createdById: mockAgentId,
    status: 'pending',
    creator: { id: mockAgentId, name: 'Agent', trustScore: 80 },
    assignee: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubtasksService,
        {
          provide: PrismaService,
          useValue: {
            task: { findUnique: jest.fn(), create: jest.fn() },
            taskRelation: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), delete: jest.fn(), update: jest.fn(), aggregate: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<SubtasksService>(SubtasksService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSubtask', () => {
    it('should create subtask with existing task', async () => {
      (prisma.task.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockParentTask)
        .mockResolvedValueOnce(mockChildTask);
      (prisma.taskRelation.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.taskRelation.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.taskRelation.aggregate as jest.Mock).mockResolvedValue({ _max: { order: null } });
      (prisma.taskRelation.create as jest.Mock).mockResolvedValue({
        id: 'relation-123',
        parentId: mockParentId,
        childId: mockChildId,
        order: 1,
        child: mockChildTask,
      });

      const result = await service.createSubtask(mockParentId, mockAgentId, { childId: mockChildId });

      expect(result.subtask.id).toBe(mockChildId);
      expect(result.subtask.order).toBe(1);
    });

    it('should create new task and subtask relation', async () => {
      const newTask = { id: 'new-task-123', title: 'New Subtask', category: 'development', createdById: mockAgentId, creator: mockChildTask.creator, assignee: null, requirements: null, reward: null };
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockParentTask);
      (prisma.task.create as jest.Mock).mockResolvedValue(newTask);
      (prisma.taskRelation.aggregate as jest.Mock).mockResolvedValue({ _max: { order: null } });
      (prisma.taskRelation.create as jest.Mock).mockResolvedValue({ id: 'new-relation-123', parentId: mockParentId, childId: newTask.id, order: 1, child: newTask });

      const result = await service.createSubtask(mockParentId, mockAgentId, { title: 'New Subtask' });

      expect(result.subtask.title).toBe('New Subtask');
    });

    it('should throw NotFoundException if parent task not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.createSubtask(mockParentId, mockAgentId, { childId: mockChildId })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if not task creator', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({ ...mockParentTask, createdById: 'other-agent' });
      await expect(service.createSubtask(mockParentId, mockAgentId, { childId: mockChildId })).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if task is already a subtask', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(mockParentTask).mockResolvedValueOnce(mockChildTask);
      (prisma.taskRelation.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-relation' });
      await expect(service.createSubtask(mockParentId, mockAgentId, { childId: mockChildId })).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if circular dependency', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValueOnce(mockParentTask).mockResolvedValueOnce(mockChildTask);
      (prisma.taskRelation.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.taskRelation.findMany as jest.Mock).mockResolvedValue([{ childId: mockParentId }]);
      await expect(service.createSubtask(mockParentId, mockAgentId, { childId: mockChildId })).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSubtasks', () => {
    it('should return subtasks list with progress', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockParentTask);
      (prisma.taskRelation.findMany as jest.Mock).mockResolvedValue([{ id: 'relation-123', parentId: mockParentId, childId: mockChildId, order: 1, child: { ...mockChildTask, _count: { bids: 2, childRelations: 1 } } }]);

      const result = await service.getSubtasks(mockParentId);

      expect(result.total).toBe(1);
      expect(result.progress).toHaveProperty('percentage');
    });

    it('should throw NotFoundException if parent task not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.getSubtasks(mockParentId)).rejects.toThrow(NotFoundException);
    });

    it('should return empty array if no subtasks', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockParentTask);
      (prisma.taskRelation.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.getSubtasks(mockParentId);

      expect(result.total).toBe(0);
      expect(result.subtasks).toHaveLength(0);
    });
  });

  describe('removeSubtask', () => {
    it('should remove subtask relation', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockParentTask);
      (prisma.taskRelation.findUnique as jest.Mock).mockResolvedValue({ id: 'relation-123' });
      (prisma.taskRelation.delete as jest.Mock).mockResolvedValue({ success: true });

      const result = await service.removeSubtask(mockParentId, mockChildId, mockAgentId);

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if relation not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockParentTask);
      (prisma.taskRelation.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.removeSubtask(mockParentId, mockChildId, mockAgentId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if not task creator', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({ ...mockParentTask, createdById: 'other-agent' });
      await expect(service.removeSubtask(mockParentId, mockChildId, mockAgentId)).rejects.toThrow(ConflictException);
    });
  });

  describe('getTaskTree', () => {
    it('should return task tree', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({ ...mockParentTask, creator: mockChildTask.creator, assignee: null, childRelations: [] });

      const result = await service.getTaskTree(mockParentId);

      expect(result.tree.id).toBe(mockParentId);
      expect(result.tree).toHaveProperty('progress');
    });

    it('should throw NotFoundException if task not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.getTaskTree(mockParentId)).rejects.toThrow(NotFoundException);
    });

    it('should respect maxDepth parameter', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({ ...mockParentTask, creator: mockChildTask.creator, assignee: null, childRelations: [] });

      const result = await service.getTaskTree(mockParentId, 0);

      expect(result.tree).toBeNull();
    });
  });

  describe('calculateProgress', () => {
    it('should return 0% for incomplete task with no subtasks', async () => {
      (prisma.taskRelation.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockParentTask);

      const result = await service.calculateProgress(mockParentId);

      expect(result.percentage).toBe(0);
    });

    it('should return 100% for completed task with no subtasks', async () => {
      (prisma.taskRelation.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({ ...mockParentTask, status: 'completed' });

      const result = await service.calculateProgress(mockParentId);

      expect(result.percentage).toBe(100);
    });

    it('should calculate progress from subtasks', async () => {
      (prisma.taskRelation.findMany as jest.Mock)
        .mockResolvedValueOnce([
          { childId: 'child-1', child: { id: 'child-1', status: 'completed' } },
          { childId: 'child-2', child: { id: 'child-2', status: 'pending' } },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      (prisma.task.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 'child-1', status: 'completed' })
        .mockResolvedValueOnce({ id: 'child-2', status: 'pending' });

      const result = await service.calculateProgress(mockParentId);

      expect(result.total).toBe(2);
      expect(result.completed).toBe(1);
      expect(result.percentage).toBe(50);
    });
  });

  describe('updateSubtaskOrder', () => {
    it('should update order of subtasks', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(mockParentTask);
      (prisma.taskRelation.update as jest.Mock).mockResolvedValue({});

      const result = await service.updateSubtaskOrder(mockParentId, mockAgentId, [{ childId: 'child-1', order: 2 }]);

      expect(result.success).toBe(true);
    });

    it('should throw NotFoundException if parent task not found', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.updateSubtaskOrder(mockParentId, mockAgentId, [])).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if not task creator', async () => {
      (prisma.task.findUnique as jest.Mock).mockResolvedValue({ ...mockParentTask, createdById: 'other-agent' });
      await expect(service.updateSubtaskOrder(mockParentId, mockAgentId, [])).rejects.toThrow(ConflictException);
    });
  });
});
