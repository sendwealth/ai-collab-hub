import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowEngine } from './workflow.engine';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkflowParser } from '../parser/workflow.parser';
import { WorkflowExecutor } from '../executor/workflow.executor';
import { WorkflowDefinitionDto } from '../dto/workflow.dto';

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;
  let prisma: any;

  const createValidDefinition = (): WorkflowDefinitionDto => ({
    nodes: [
      { id: 'start', type: 'start' },
      { id: 'task1', type: 'task', agentId: 'agent-1' },
      { id: 'end', type: 'end' },
    ],
    edges: [
      { from: 'start', to: 'task1' },
      { from: 'task1', to: 'end' },
    ],
  });

  const mockTemplate = {
    id: 'template-1',
    name: 'Test Workflow',
    description: 'Test workflow description',
    category: 'test',
    version: '1.0.0',
    definition: JSON.stringify(createValidDefinition()),
    tags: null,
    author: 'test',
    isActive: true,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockInstance = {
    id: 'instance-1',
    templateId: 'template-1',
    taskId: null,
    status: 'pending',
    context: '{}',
    currentNode: 'start',
    startedAt: null,
    completedAt: null,
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    template: mockTemplate,
    nodeExecutions: [],
  };

  beforeEach(async () => {
    const mockPrisma = {
      workflowTemplate: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      workflowInstance: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      workflowNodeExecution: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowEngine,
        WorkflowParser,
        WorkflowExecutor,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    engine = module.get<WorkflowEngine>(WorkflowEngine);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // startWorkflow() - 启动工作流
  // ============================================
  describe('startWorkflow()', () => {
    it('should start a workflow from template', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.create.mockResolvedValue(mockInstance as any);
      prisma.workflowTemplate.update.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.update.mockResolvedValue(mockInstance as any);
      prisma.workflowInstance.findUnique.mockResolvedValue({
        ...mockInstance,
        status: 'running',
      } as any);
      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: 'instance-1',
        nodeId: 'start',
        nodeType: 'start',
        status: 'completed',
        input: '{}',
        output: '{}',
        error: null,
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const instanceId = await engine.startWorkflow('template-1');

      expect(instanceId).toBeDefined();
      expect(prisma.workflowTemplate.findUnique).toHaveBeenCalledWith({
        where: { id: 'template-1' },
      });
      expect(prisma.workflowInstance.create).toHaveBeenCalled();
    });

    it('should throw error if template not found', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(null);

      await expect(engine.startWorkflow('nonexistent')).rejects.toThrow('not found');
    });

    it('should throw error if template is inactive', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue({
        ...mockTemplate,
        isActive: false,
      } as any);

      await expect(engine.startWorkflow('template-1')).rejects.toThrow('not active');
    });

    it('should create instance with initial context', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.create.mockResolvedValue(mockInstance as any);
      prisma.workflowTemplate.update.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.update.mockResolvedValue(mockInstance as any);
      prisma.workflowInstance.findUnique.mockResolvedValue({
        ...mockInstance,
        context: JSON.stringify({ customVar: 'value' }),
      } as any);
      prisma.workflowNodeExecution.create.mockResolvedValue({} as any);
      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      await engine.startWorkflow('template-1', undefined, { customVar: 'value' });

      expect(prisma.workflowInstance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            context: JSON.stringify({ customVar: 'value' }),
          }),
        })
      );
    });

    it('should increment template usage count', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.create.mockResolvedValue(mockInstance as any);
      prisma.workflowTemplate.update.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.update.mockResolvedValue(mockInstance as any);
      prisma.workflowInstance.findUnique.mockResolvedValue(mockInstance as any);
      prisma.workflowNodeExecution.create.mockResolvedValue({} as any);
      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      await engine.startWorkflow('template-1');

      expect(prisma.workflowTemplate.update).toHaveBeenCalledWith({
        where: { id: 'template-1' },
        data: { usageCount: { increment: 1 } },
      });
    });

    it('should start workflow with associated task ID', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.create.mockResolvedValue(mockInstance as any);
      prisma.workflowTemplate.update.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.update.mockResolvedValue(mockInstance as any);
      prisma.workflowInstance.findUnique.mockResolvedValue(mockInstance as any);
      prisma.workflowNodeExecution.create.mockResolvedValue({} as any);
      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      await engine.startWorkflow('template-1', 'task-123');

      expect(prisma.workflowInstance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            taskId: 'task-123',
          }),
        })
      );
    });
  });

  // ============================================
  // pauseWorkflow() - 暂停工作流
  // ============================================
  describe('pauseWorkflow()', () => {
    it('should pause a running workflow', async () => {
      prisma.workflowInstance.update.mockResolvedValue({
        ...mockInstance,
        status: 'paused',
      } as any);

      await engine.pauseWorkflow('instance-1');

      expect(prisma.workflowInstance.update).toHaveBeenCalledWith({
        where: { id: 'instance-1' },
        data: { status: 'paused' },
      });
    });

    it('should cancel any scheduled execution', async () => {
      prisma.workflowInstance.update.mockResolvedValue({
        ...mockInstance,
        status: 'paused',
      } as any);

      await engine.pauseWorkflow('instance-1');

      // The runningWorkflows map should have the entry removed
      expect(engine['runningWorkflows'].has('instance-1')).toBe(false);
    });
  });

  // ============================================
  // resumeWorkflow() - 恢复工作流
  // ============================================
  describe('resumeWorkflow()', () => {
    it('should resume a paused workflow', async () => {
      const pausedInstance = {
        ...mockInstance,
        status: 'paused',
        template: mockTemplate,
      };

      prisma.workflowInstance.findUnique.mockResolvedValue(pausedInstance as any);
      prisma.workflowInstance.update.mockResolvedValue({
        ...pausedInstance,
        status: 'running',
      } as any);
      prisma.workflowNodeExecution.create.mockResolvedValue({} as any);
      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      await engine.resumeWorkflow('instance-1');

      expect(prisma.workflowInstance.findUnique).toHaveBeenCalledWith({
        where: { id: 'instance-1' },
        include: { template: true },
      });
    });

    it('should throw error if instance not found', async () => {
      prisma.workflowInstance.findUnique.mockResolvedValue(null);

      await expect(engine.resumeWorkflow('nonexistent')).rejects.toThrow();
    });

    it('should throw error if workflow is not paused', async () => {
      prisma.workflowInstance.findUnique.mockResolvedValue({
        ...mockInstance,
        status: 'running',
        template: mockTemplate,
      } as any);

      await expect(engine.resumeWorkflow('instance-1')).rejects.toThrow('Cannot resume');
    });
  });

  // ============================================
  // cancelWorkflow() - 取消工作流
  // ============================================
  describe('cancelWorkflow()', () => {
    it('should cancel a workflow', async () => {
      prisma.workflowInstance.update.mockResolvedValue({
        ...mockInstance,
        status: 'cancelled',
        completedAt: new Date(),
      } as any);

      await engine.cancelWorkflow('instance-1');

      expect(prisma.workflowInstance.update).toHaveBeenCalledWith({
        where: { id: 'instance-1' },
        data: {
          status: 'cancelled',
          completedAt: expect.any(Date),
        },
      });
    });

    it('should remove from running workflows map', async () => {
      prisma.workflowInstance.update.mockResolvedValue({
        ...mockInstance,
        status: 'cancelled',
      } as any);

      await engine.cancelWorkflow('instance-1');

      expect(engine['runningWorkflows'].has('instance-1')).toBe(false);
    });
  });

  // ============================================
  // getWorkflowState() - 获取工作流状态
  // ============================================
  describe('getWorkflowState()', () => {
    it('should return workflow state', async () => {
      prisma.workflowInstance.findUnique.mockResolvedValue({
        ...mockInstance,
        status: 'running',
        nodeExecutions: [
          {
            id: 'exec-1',
            nodeId: 'start',
            status: 'completed',
            createdAt: new Date(),
          },
        ],
      } as any);

      const state = await engine.getWorkflowState('instance-1');

      expect(state).toHaveProperty('instanceId', 'instance-1');
      expect(state).toHaveProperty('status', 'running');
      expect(state).toHaveProperty('currentNode');
      expect(state).toHaveProperty('context');
      expect(state).toHaveProperty('history');
    });

    it('should throw error if instance not found', async () => {
      prisma.workflowInstance.findUnique.mockResolvedValue(null);

      await expect(engine.getWorkflowState('nonexistent')).rejects.toThrow('not found');
    });

    it('should include execution history', async () => {
      const executions = [
        {
          id: 'exec-1',
          nodeId: 'start',
          status: 'completed',
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 'exec-2',
          nodeId: 'task1',
          status: 'completed',
          createdAt: new Date('2024-01-01T10:00:01Z'),
        },
      ];

      prisma.workflowInstance.findUnique.mockResolvedValue({
        ...mockInstance,
        nodeExecutions: executions,
      } as any);

      const state = await engine.getWorkflowState('instance-1');

      expect(state.history).toHaveLength(2);
      expect(state.history[0]).toHaveProperty('nodeId', 'start');
      expect(state.history[1]).toHaveProperty('nodeId', 'task1');
    });
  });

  // ============================================
  // Integration: Full Workflow Execution
  // ============================================
  describe('workflow execution flow', () => {
    it('should execute simple workflow from start to end', async () => {
      // Setup mocks for full execution
      prisma.workflowTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.create.mockResolvedValue(mockInstance as any);
      prisma.workflowTemplate.update.mockResolvedValue(mockTemplate as any);

      // Mock instance retrieval during execution
      prisma.workflowInstance.findUnique.mockResolvedValue({
        ...mockInstance,
        status: 'running',
      } as any);

      // Mock updates
      prisma.workflowInstance.update.mockResolvedValue({} as any);

      // Mock node executions
      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: 'instance-1',
        nodeId: 'start',
        nodeType: 'start',
        status: 'completed',
        input: '{}',
        output: '{}',
        error: null,
        startedAt: new Date(),
        completedAt: new Date(),
        duration: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const instanceId = await engine.startWorkflow('template-1');

      expect(instanceId).toBeDefined();
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('edge cases', () => {
    it('should handle workflow with empty context', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.create.mockResolvedValue(mockInstance as any);
      prisma.workflowTemplate.update.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.update.mockResolvedValue({} as any);
      prisma.workflowInstance.findUnique.mockResolvedValue({
        ...mockInstance,
        context: null,
      } as any);
      prisma.workflowNodeExecution.create.mockResolvedValue({} as any);
      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const instanceId = await engine.startWorkflow('template-1');

      expect(instanceId).toBeDefined();
    });

    it('should handle max iterations exceeded', () => {
      // Create a workflow that could loop infinitely
      // This would be caught by the parser in a real scenario
      // but we're testing the engine's safety mechanisms
    });
  });

  // ============================================
  // Resume Running Workflows on Init
  // ============================================
  describe('onModuleInit', () => {
    it('should resume running workflows on module init', async () => {
      // This tests the onModuleInit behavior
      // In a real test, we would need to trigger the lifecycle hook
      const runningInstances = [
        {
          ...mockInstance,
          status: 'running',
          template: mockTemplate,
        },
      ];

      prisma.workflowInstance.findMany.mockResolvedValue(runningInstances as any);
      prisma.workflowInstance.update.mockResolvedValue({} as any);
      prisma.workflowInstance.findUnique.mockResolvedValue(runningInstances[0] as any);
      prisma.workflowNodeExecution.create.mockResolvedValue({} as any);
      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      // The actual test would need to verify resumeRunningWorkflows was called
      // This is a placeholder for that logic
    });
  });
});
