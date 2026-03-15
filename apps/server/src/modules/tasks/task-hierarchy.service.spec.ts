import { Test, TestingModule } from '@nestjs/testing';
import { TaskHierarchyService } from './task-hierarchy.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('TaskHierarchyService (TDD)', () => {
  let service: TaskHierarchyService;
  let prisma: PrismaService;

  const mockPrismaService = {
    task: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    taskRelation: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskHierarchyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TaskHierarchyService>(TaskHierarchyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Task Hierarchy Management', () => {
    describe('createSubtask', () => {
      it('should create a subtask successfully', async () => {
        const parentId = 'parent-task-id';
        const agentId = 'agent-id';
        const createSubtaskDto = {
          title: 'Subtask Title',
          description: 'Subtask Description',
        };

        mockPrismaService.task.findUnique.mockResolvedValue({
          id: parentId,
          title: 'Parent Task',
          createdById: agentId,
          level: 0,
        });

        mockPrismaService.task.create.mockResolvedValue({
          id: 'new-subtask-id',
          title: createSubtaskDto.title,
          description: createSubtaskDto.description,
          level: 1,
          createdById: agentId,
        });

        mockPrismaService.taskRelation.aggregate.mockResolvedValue({
          _max: { order: null },
        });

        mockPrismaService.taskRelation.create.mockResolvedValue({
          parentId,
          childId: 'new-subtask-id',
          order: 1,
        });

        const result = await service.createSubtask(parentId, agentId, createSubtaskDto);

        expect(result).toBeDefined();
        expect(result.childTask.id).toBe('new-subtask-id');
        expect(result.childTask.level).toBe(1);
      });

      it('should throw NotFoundException if parent task not found', async () => {
        mockPrismaService.task.findUnique.mockResolvedValue(null);

        await expect(
          service.createSubtask('invalid-id', 'agent-id', { title: 'Test' }),
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ConflictException if agent is not task creator', async () => {
        mockPrismaService.task.findUnique.mockResolvedValue({
          id: 'parent-id',
          createdById: 'other-agent-id',
        });

        await expect(
          service.createSubtask('parent-id', 'agent-id', { title: 'Test' }),
        ).rejects.toThrow(ConflictException);
      });

      it('should prevent creating circular dependencies', async () => {
        const parentId = 'parent-id';
        const childId = 'child-id';

        mockPrismaService.task.findUnique.mockResolvedValue({
          id: parentId,
          createdById: 'agent-id',
        });

        // Simulate circular dependency (child already has parent as descendant)
        mockPrismaService.$queryRaw.mockResolvedValue([{ count: 1 }]);

        await expect(
          service.createSubtask(parentId, 'agent-id', { childId }),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('getSubtasks', () => {
      it('should return all subtasks of a task', async () => {
        const taskId = 'task-id';
        const subtasks = [
          { id: 'subtask-1', title: 'Subtask 1', level: 1, order: 1 },
          { id: 'subtask-2', title: 'Subtask 2', level: 1, order: 2 },
        ];

        mockPrismaService.taskRelation.findMany.mockResolvedValue(
          subtasks.map((s, idx) => ({
            parentId: taskId,
            childId: s.id,
            order: s.order,
            child: s,
          })),
        );

        const result = await service.getSubtasks(taskId);

        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('subtask-1');
      });
    });

    describe('updateHierarchy', () => {
      it('should update task order successfully', async () => {
        const taskId = 'task-id';
        const updateDto = {
          orders: [
            { childId: 'child-1', order: 2 },
            { childId: 'child-2', order: 1 },
          ],
        };

        mockPrismaService.taskRelation.findUnique.mockResolvedValue({
          parentId: taskId,
        });

        mockPrismaService.$executeRaw.mockResolvedValue(1);

        const result = await service.updateHierarchy(taskId, updateDto);

        expect(result.success).toBe(true);
      });
    });

    describe('addDependency', () => {
      it('should add task dependency successfully', async () => {
        const taskId = 'task-1';
        const dependencyId = 'task-2';
        const agentId = 'agent-id';

        mockPrismaService.task.findUnique
          .mockResolvedValueOnce({
            id: taskId,
            createdById: agentId,
            dependencies: [],
          })
          .mockResolvedValueOnce({
            id: dependencyId,
          });

        mockPrismaService.task.update.mockResolvedValue({
          id: taskId,
          dependencies: [dependencyId],
        });

        const result = await service.addDependency(taskId, dependencyId, agentId);

        expect(result.dependencies).toContain(dependencyId);
      });

      it('should prevent circular dependencies', async () => {
        const taskId = 'task-1';
        const dependencyId = 'task-2';
        const agentId = 'agent-id';

        mockPrismaService.task.findUnique
          .mockResolvedValueOnce({
            id: taskId,
            createdById: agentId,
            dependencies: [],
          })
          .mockResolvedValueOnce({
            id: dependencyId,
            dependencies: [taskId], // dependency already depends on task
          });

        await expect(
          service.addDependency(taskId, dependencyId, agentId),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('removeDependency', () => {
      it('should remove task dependency successfully', async () => {
        const taskId = 'task-1';
        const dependencyId = 'task-2';
        const agentId = 'agent-id';

        mockPrismaService.task.findUnique.mockResolvedValue({
          id: taskId,
          createdById: agentId,
          dependencies: [dependencyId],
        });

        mockPrismaService.task.update.mockResolvedValue({
          id: taskId,
          dependencies: [],
        });

        const result = await service.removeDependency(taskId, dependencyId, agentId);

        expect(result.dependencies).not.toContain(dependencyId);
      });
    });
  });

  describe('Task Tree Traversal', () => {
    describe('getTaskTree', () => {
      it('should return full task tree with all descendants', async () => {
        const taskId = 'root-task-id';

        mockPrismaService.task.findUnique.mockResolvedValue({
          id: taskId,
          title: 'Root Task',
          level: 0,
        });

        mockPrismaService.$queryRaw.mockResolvedValue([
          { id: 'child-1', title: 'Child 1', level: 1, parentId: taskId },
          { id: 'grandchild-1', title: 'Grandchild 1', level: 2, parentId: 'child-1' },
        ]);

        const result = await service.getTaskTree(taskId);

        expect(result.id).toBe(taskId);
        expect(result.children).toBeDefined();
      });
    });

    describe('getTaskPath', () => {
      it('should return path from root to task', async () => {
        const taskId = 'grandchild-id';

        mockPrismaService.$queryRaw.mockResolvedValue([
          { id: 'root-id', title: 'Root', level: 0 },
          { id: 'child-id', title: 'Child', level: 1 },
          { id: taskId, title: 'Grandchild', level: 2 },
        ]);

        const result = await service.getTaskPath(taskId);

        expect(result).toHaveLength(3);
        expect(result[0].level).toBe(0);
        expect(result[2].id).toBe(taskId);
      });
    });
  });

  describe('Status Propagation', () => {
    describe('propagateCompletion', () => {
      it('should mark parent as completed when all children are completed', async () => {
        const parentId = 'parent-id';

        mockPrismaService.taskRelation.findMany.mockResolvedValue([
          { childId: 'child-1', child: { status: 'completed' } },
          { childId: 'child-2', child: { status: 'completed' } },
        ]);

        mockPrismaService.task.update.mockResolvedValue({
          id: parentId,
          status: 'completed',
        });

        const result = await service.propagateCompletion(parentId);

        expect(result.status).toBe('completed');
      });

      it('should not mark parent as completed if some children are not completed', async () => {
        const parentId = 'parent-id';

        mockPrismaService.taskRelation.findMany.mockResolvedValue([
          { childId: 'child-1', child: { status: 'completed' } },
          { childId: 'child-2', child: { status: 'in_progress' } },
        ]);

        const result = await service.propagateCompletion(parentId);

        expect(result).toBeNull();
      });
    });
  });

  describe('Milestone Management', () => {
    describe('createMilestone', () => {
      it('should create a milestone successfully', async () => {
        const taskId = 'task-id';
        const createDto = {
          name: 'Milestone 1',
          description: 'First milestone',
          dueDate: '2024-12-31T00:00:00Z',
        };

        mockPrismaService.task.findUnique.mockResolvedValue({
          id: taskId,
        });

        mockPrismaService.task.update.mockResolvedValue({
          id: 'milestone-id',
          ...createDto,
          taskId,
          status: 'PENDING',
          order: 1,
        });

        const result = await service.createMilestone(taskId, createDto);

        expect(result.name).toBe(createDto.name);
        expect(result.status).toBe('PENDING');
      });
    });

    describe('getMilestones', () => {
      it('should return all milestones for a task', async () => {
        const taskId = 'task-id';
        const milestones = [
          { id: 'm1', name: 'Milestone 1', status: 'COMPLETED', order: 1 },
          { id: 'm2', name: 'Milestone 2', status: 'PENDING', order: 2 },
        ];

        mockPrismaService.task.findUnique.mockResolvedValue({
          id: taskId,
          milestones,
        });

        const result = await service.getMilestones(taskId);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Milestone 1');
      });
    });

    describe('calculateMilestoneProgress', () => {
      it('should calculate milestone progress correctly', async () => {
        const taskId = 'task-id';

        mockPrismaService.task.findUnique.mockResolvedValue({
          id: taskId,
          milestones: [
            { id: 'm1', status: 'COMPLETED' },
            { id: 'm2', status: 'COMPLETED' },
            { id: 'm3', status: 'PENDING' },
          ],
        });

        const result = await service.calculateMilestoneProgress(taskId);

        expect(result.total).toBe(3);
        expect(result.completed).toBe(2);
        expect(result.percentage).toBe(66.67);
      });
    });
  });
});
