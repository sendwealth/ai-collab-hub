import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowsService } from './workflows.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { WorkflowEngine } from './engine/workflow.engine';
import { WorkflowParser } from './parser/workflow.parser';
import { WorkflowExecutor } from './executor/workflow.executor';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WorkflowDefinitionDto } from './dto/workflow.dto';

describe('WorkflowsService', () => {
  let service: WorkflowsService;
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
    usageCount: 5,
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
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      workflowInstance: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      workflowNodeExecution: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowsService,
        WorkflowEngine,
        WorkflowParser,
        WorkflowExecutor,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<WorkflowsService>(WorkflowsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // Template Management - createTemplate
  // ============================================
  describe('createTemplate()', () => {
    it('should create a valid workflow template', async () => {
      prisma.workflowTemplate.create.mockResolvedValue(mockTemplate as any);

      const result = await service.createTemplate({
        name: 'Test Workflow',
        category: 'test',
        definition: createValidDefinition(),
      });

      expect(result).toBeDefined();
      expect(prisma.workflowTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Workflow',
            category: 'test',
          }),
        })
      );
    });

    it('should throw BadRequestException for invalid definition', async () => {
      const invalidDefinition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          // Missing end node
        ],
        edges: [],
      };

      await expect(
        service.createTemplate({
          name: 'Invalid Workflow',
          category: 'test',
          definition: invalidDefinition,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should create template with all optional fields', async () => {
      prisma.workflowTemplate.create.mockResolvedValue(mockTemplate as any);

      await service.createTemplate({
        name: 'Full Workflow',
        description: 'A complete workflow',
        category: 'data-processing',
        version: '2.0.0',
        definition: createValidDefinition(),
        tags: ['data', 'processing'],
        author: 'test-author',
        isActive: false,
      });

      expect(prisma.workflowTemplate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: 'A complete workflow',
            version: '2.0.0',
            tags: JSON.stringify(['data', 'processing']),
            author: 'test-author',
            isActive: false,
          }),
        })
      );
    });
  });

  // ============================================
  // Template Management - getTemplates
  // ============================================
  describe('getTemplates()', () => {
    it('should return all templates', async () => {
      prisma.workflowTemplate.findMany.mockResolvedValue([mockTemplate] as any);

      const result = await service.getTemplates();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Workflow');
    });

    it('should filter templates by category', async () => {
      prisma.workflowTemplate.findMany.mockResolvedValue([mockTemplate] as any);

      await service.getTemplates({ category: 'test' });

      expect(prisma.workflowTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: 'test' },
        })
      );
    });

    it('should filter templates by active status', async () => {
      prisma.workflowTemplate.findMany.mockResolvedValue([mockTemplate] as any);

      await service.getTemplates({ isActive: true });

      expect(prisma.workflowTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
        })
      );
    });

    it('should apply multiple filters', async () => {
      prisma.workflowTemplate.findMany.mockResolvedValue([mockTemplate] as any);

      await service.getTemplates({ category: 'test', isActive: true });

      expect(prisma.workflowTemplate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: 'test', isActive: true },
        })
      );
    });
  });

  // ============================================
  // Template Management - getTemplate
  // ============================================
  describe('getTemplate()', () => {
    it('should return template by ID', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(mockTemplate as any);

      const result = await service.getTemplate('template-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('template-1');
    });

    it('should throw NotFoundException for non-existent template', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(null);

      await expect(service.getTemplate('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // Template Management - updateTemplate
  // ============================================
  describe('updateTemplate()', () => {
    it('should update template name', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      prisma.workflowTemplate.update.mockResolvedValue({
        ...mockTemplate,
        name: 'Updated Name',
      } as any);

      const result = await service.updateTemplate('template-1', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should validate new definition on update', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(mockTemplate as any);

      const invalidDefinition: WorkflowDefinitionDto = {
        nodes: [{ id: 'start', type: 'start' }],
        edges: [],
      };

      await expect(
        service.updateTemplate('template-1', {
          definition: invalidDefinition,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent template', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTemplate('nonexistent', { name: 'New Name' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // Template Management - deleteTemplate
  // ============================================
  describe('deleteTemplate()', () => {
    it('should delete template without running instances', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.count.mockResolvedValue(0);
      prisma.workflowTemplate.delete.mockResolvedValue(mockTemplate as any);

      const result = await service.deleteTemplate('template-1');

      expect(result.success).toBe(true);
      expect(prisma.workflowTemplate.delete).toHaveBeenCalledWith({
        where: { id: 'template-1' },
      });
    });

    it('should throw error if template has running instances', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.count.mockResolvedValue(3);

      await expect(service.deleteTemplate('template-1')).rejects.toThrow(
        'Cannot delete template with 3 running instances'
      );
    });

    it('should throw NotFoundException for non-existent template', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(null);

      await expect(service.deleteTemplate('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // Instance Management - startWorkflow
  // ============================================
  describe('startWorkflow()', () => {
    it('should start workflow from template', async () => {
      // Mock template retrieval
      prisma.workflowTemplate.findUnique.mockResolvedValue(mockTemplate as any);

      // Mock instance creation
      prisma.workflowInstance.create.mockResolvedValue(mockInstance as any);
      prisma.workflowTemplate.update.mockResolvedValue(mockTemplate as any);

      // Mock execution updates
      prisma.workflowInstance.update.mockResolvedValue({} as any);
      prisma.workflowInstance.findUnique.mockResolvedValue({
        ...mockInstance,
        status: 'running',
      } as any);

      // Mock node execution
      prisma.workflowNodeExecution.create.mockResolvedValue({} as any);
      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await service.startWorkflow({
        templateId: 'template-1',
      });

      expect(result).toBeDefined();
    });

    it('should start workflow with initial context', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.create.mockResolvedValue(mockInstance as any);
      prisma.workflowTemplate.update.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.update.mockResolvedValue({} as any);
      prisma.workflowInstance.findUnique.mockResolvedValue({
        ...mockInstance,
        context: JSON.stringify({ userId: 'user-1' }),
      } as any);
      prisma.workflowNodeExecution.create.mockResolvedValue({} as any);
      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      await service.startWorkflow({
        templateId: 'template-1',
        context: { userId: 'user-1' },
      });

      expect(prisma.workflowInstance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            context: JSON.stringify({ userId: 'user-1' }),
          }),
        })
      );
    });

    it('should start workflow with associated task', async () => {
      prisma.workflowTemplate.findUnique.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.create.mockResolvedValue(mockInstance as any);
      prisma.workflowTemplate.update.mockResolvedValue(mockTemplate as any);
      prisma.workflowInstance.update.mockResolvedValue({} as any);
      prisma.workflowInstance.findUnique.mockResolvedValue(mockInstance as any);
      prisma.workflowNodeExecution.create.mockResolvedValue({} as any);
      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      await service.startWorkflow({
        templateId: 'template-1',
        taskId: 'task-123',
      });

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
  // Instance Management - getInstance
  // ============================================
  describe('getInstance()', () => {
    it('should return instance with template and executions', async () => {
      prisma.workflowInstance.findUnique.mockResolvedValue({
        ...mockInstance,
        template: mockTemplate,
        nodeExecutions: [],
      } as any);

      const result = await service.getInstance('instance-1');

      expect(result).toBeDefined();
      expect(result.template).toBeDefined();
    });

    it('should throw NotFoundException for non-existent instance', async () => {
      prisma.workflowInstance.findUnique.mockResolvedValue(null);

      await expect(service.getInstance('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // Instance Management - getInstances
  // ============================================
  describe('getInstances()', () => {
    it('should return all instances', async () => {
      prisma.workflowInstance.findMany.mockResolvedValue([
        { ...mockInstance, template: mockTemplate },
      ] as any);

      const result = await service.getInstances();

      expect(result).toHaveLength(1);
    });

    it('should filter instances by status', async () => {
      prisma.workflowInstance.findMany.mockResolvedValue([mockInstance] as any);

      await service.getInstances({ status: 'running' });

      expect(prisma.workflowInstance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'running' },
        })
      );
    });

    it('should filter instances by template', async () => {
      prisma.workflowInstance.findMany.mockResolvedValue([mockInstance] as any);

      await service.getInstances({ templateId: 'template-1' });

      expect(prisma.workflowInstance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { templateId: 'template-1' },
        })
      );
    });
  });

  // ============================================
  // Instance Management - pauseWorkflow
  // ============================================
  describe('pauseWorkflow()', () => {
    it('should pause running workflow', async () => {
      prisma.workflowInstance.update.mockResolvedValue({} as any);
      prisma.workflowInstance.findUnique.mockResolvedValue({
        ...mockInstance,
        status: 'paused',
      } as any);

      const result = await service.pauseWorkflow('instance-1');

      expect(result.status).toBe('paused');
    });
  });

  // ============================================
  // Instance Management - resumeWorkflow
  // ============================================
  describe('resumeWorkflow()', () => {
    it('should resume paused workflow', async () => {
      const pausedInstance = {
        ...mockInstance,
        status: 'paused',
        template: mockTemplate,
      };

      prisma.workflowInstance.findUnique.mockResolvedValue(pausedInstance as any);
      prisma.workflowInstance.update.mockResolvedValue({} as any);
      prisma.workflowNodeExecution.create.mockResolvedValue({} as any);
      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await service.resumeWorkflow('instance-1');

      expect(result).toBeDefined();
    });
  });

  // ============================================
  // Instance Management - cancelWorkflow
  // ============================================
  describe('cancelWorkflow()', () => {
    it('should cancel workflow', async () => {
      prisma.workflowInstance.update.mockResolvedValue({} as any);
      prisma.workflowInstance.findUnique.mockResolvedValue({
        ...mockInstance,
        status: 'cancelled',
      } as any);

      const result = await service.cancelWorkflow('instance-1');

      expect(result.status).toBe('cancelled');
    });
  });

  // ============================================
  // Node Execution History
  // ============================================
  describe('getNodeExecutions()', () => {
    it('should return execution history', async () => {
      const executions = [
        {
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
        },
        {
          id: 'exec-2',
          instanceId: 'instance-1',
          nodeId: 'task1',
          nodeType: 'task',
          status: 'completed',
          input: '{}',
          output: '{}',
          error: null,
          startedAt: new Date(),
          completedAt: new Date(),
          duration: 200,
          createdAt: new Date(),
        },
      ];

      prisma.workflowNodeExecution.findMany.mockResolvedValue(executions as any);

      const result = await service.getNodeExecutions('instance-1');

      expect(result).toHaveLength(2);
      expect(result[0].nodeId).toBe('start');
      expect(result[1].nodeId).toBe('task1');
    });
  });

  // ============================================
  // Statistics
  // ============================================
  describe('getStatistics()', () => {
    it('should return workflow statistics', async () => {
      prisma.workflowTemplate.count
        .mockResolvedValueOnce(10) // total templates
        .mockResolvedValueOnce(8); // active templates

      prisma.workflowInstance.count
        .mockResolvedValueOnce(50) // total instances
        .mockResolvedValueOnce(5) // running
        .mockResolvedValueOnce(40) // completed
        .mockResolvedValueOnce(5); // failed

      const result = await service.getStatistics();

      expect(result.templates.total).toBe(10);
      expect(result.templates.active).toBe(8);
      expect(result.instances.total).toBe(50);
      expect(result.instances.running).toBe(5);
      expect(result.instances.completed).toBe(40);
      expect(result.instances.failed).toBe(5);
    });
  });

  // ============================================
  // getWorkflowState
  // ============================================
  describe('getWorkflowState()', () => {
    it('should return workflow state from engine', async () => {
      prisma.workflowInstance.findUnique.mockResolvedValue({
        ...mockInstance,
        status: 'running',
        nodeExecutions: [],
      } as any);

      const result = await service.getWorkflowState('instance-1');

      expect(result).toHaveProperty('instanceId');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('context');
      expect(result).toHaveProperty('history');
    });
  });
});
