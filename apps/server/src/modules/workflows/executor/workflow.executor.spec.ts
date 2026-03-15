import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowExecutor, WorkflowExecutionContext } from './workflow.executor';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkflowNodeDto, WorkflowEdgeDto } from '../dto/workflow.dto';
import { ParsedWorkflow } from '../parser/workflow.parser';

describe('WorkflowExecutor', () => {
  let executor: WorkflowExecutor;
  let prisma: any;

  const mockExecutionContext: WorkflowExecutionContext = {
    instanceId: 'test-instance-id',
    variables: {},
    history: [],
    currentNode: null,
  };

  const createParsedWorkflow = (
    nodes: Partial<WorkflowNodeDto>[],
    edges: Partial<WorkflowEdgeDto>[] = []
  ): ParsedWorkflow => {
    const nodeMap = new Map<string, WorkflowNodeDto>();
    const fullNodes: WorkflowNodeDto[] = nodes.map((n, i) => ({
      id: n.id || `node-${i}`,
      type: n.type || 'task',
      agentId: n.agentId,
      condition: n.condition,
      delay: n.delay,
      config: n.config,
    } as WorkflowNodeDto));

    fullNodes.forEach(n => nodeMap.set(n.id, n));

    const edgeMap = new Map<string, WorkflowEdgeDto[]>();
    const fullEdges: WorkflowEdgeDto[] = edges.map((e, i) => ({
      from: e.from || `from-${i}`,
      to: e.to || `to-${i}`,
      condition: e.condition,
    } as WorkflowEdgeDto));

    fullEdges.forEach(e => {
      if (!edgeMap.has(e.from)) {
        edgeMap.set(e.from, []);
      }
      edgeMap.get(e.from)!.push(e);
    });

    const adjList = new Map<string, string[]>();
    fullEdges.forEach(e => {
      if (!adjList.has(e.from)) {
        adjList.set(e.from, []);
      }
      adjList.get(e.from)!.push(e.to);
    });

    return {
      nodes: nodeMap,
      edges: edgeMap,
      startNode: fullNodes.find(n => n.type === 'start')?.id || 'start',
      endNodes: fullNodes.filter(n => n.type === 'end').map(n => n.id),
      adjacencyList: adjList,
    };
  };

  beforeEach(async () => {
    const mockPrisma = {
      workflowNodeExecution: {
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      workflowInstance: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowExecutor,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    executor = module.get<WorkflowExecutor>(WorkflowExecutor);
    prisma = module.get(PrismaService);
  });

  // ============================================
  // executeNode() - 执行节点
  // ============================================
  describe('executeNode()', () => {
    it('should create execution record when executing node', async () => {
      const node: WorkflowNodeDto = {
        id: 'start',
        type: 'start',
      };

      const workflow = createParsedWorkflow([node]);

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'start',
        nodeType: 'start',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      await executor.executeNode(node, mockExecutionContext, workflow);

      expect(prisma.workflowNodeExecution.create).toHaveBeenCalledWith({
        data: {
          instanceId: mockExecutionContext.instanceId,
          nodeId: 'start',
          nodeType: 'start',
          status: 'running',
          input: JSON.stringify(mockExecutionContext.variables),
          startedAt: expect.any(Date),
        },
      });
    });

    it('should update execution record on completion', async () => {
      const node: WorkflowNodeDto = {
        id: 'start',
        type: 'start',
      };

      const workflow = createParsedWorkflow([node]);
      const startedAt = new Date();

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'start',
        nodeType: 'start',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt,
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await executor.executeNode(node, mockExecutionContext, workflow);

      expect(result.success).toBe(true);
      expect(prisma.workflowNodeExecution.update).toHaveBeenCalledWith({
        where: { id: 'exec-1' },
        data: {
          status: 'completed',
          output: expect.any(String),
          completedAt: expect.any(Date),
          duration: expect.any(Number),
        },
      });
    });

    it('should update execution record on failure', async () => {
      const node: WorkflowNodeDto = {
        id: 'invalid',
        type: 'invalid-type' as any,
      };

      const workflow = createParsedWorkflow([node]);

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'invalid',
        nodeType: 'invalid-type',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.updateMany.mockResolvedValue({ count: 1 } as any);

      const result = await executor.executeNode(node, mockExecutionContext, workflow);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown node type');
    });
  });

  // ============================================
  // executeStart() - 执行开始节点
  // ============================================
  describe('executeStart()', () => {
    it('should execute start node successfully', async () => {
      const node: WorkflowNodeDto = {
        id: 'start',
        type: 'start',
      };

      const workflow = createParsedWorkflow([node]);

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'start',
        nodeType: 'start',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await executor.executeNode(node, mockExecutionContext, workflow);

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('started', true);
      expect(result.output).toHaveProperty('timestamp');
    });
  });

  // ============================================
  // executeEnd() - 执行结束节点
  // ============================================
  describe('executeEnd()', () => {
    it('should execute end node and return final context', async () => {
      const node: WorkflowNodeDto = {
        id: 'end',
        type: 'end',
      };

      const contextWithVars: WorkflowExecutionContext = {
        ...mockExecutionContext,
        variables: { result: 'success', count: 42 },
      };

      const workflow = createParsedWorkflow([node]);

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'end',
        nodeType: 'end',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await executor.executeNode(node, contextWithVars, workflow);

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('completed', true);
      expect(result.output).toHaveProperty('finalContext');
      expect(result.output.finalContext).toEqual({ result: 'success', count: 42 });
    });
  });

  // ============================================
  // executeTask() - 执行任务节点
  // ============================================
  describe('executeTask()', () => {
    it('should execute task with agentId', async () => {
      const node: WorkflowNodeDto = {
        id: 'task1',
        type: 'task',
        agentId: 'agent-1',
      };

      const workflow = createParsedWorkflow([node]);

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'task1',
        nodeType: 'task',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await executor.executeNode(node, mockExecutionContext, workflow);

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('agentId', 'agent-1');
      expect(result.output).toHaveProperty('taskId');
      expect(result.output).toHaveProperty('status', 'completed');
    });

    it('should execute task with agentId in config', async () => {
      const node: WorkflowNodeDto = {
        id: 'task1',
        type: 'task',
        config: { agentId: 'agent-config' },
      };

      const workflow = createParsedWorkflow([node]);

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'task1',
        nodeType: 'task',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await executor.executeNode(node, mockExecutionContext, workflow);

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('agentId', 'agent-config');
    });

    it('should return expected result from config', async () => {
      const node: WorkflowNodeDto = {
        id: 'task1',
        type: 'task',
        agentId: 'agent-1',
        config: { expectedResult: 'Custom result' },
      };

      const workflow = createParsedWorkflow([node]);

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'task1',
        nodeType: 'task',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await executor.executeNode(node, mockExecutionContext, workflow);

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('result', 'Custom result');
    });
  });

  // ============================================
  // executeCondition() - 执行条件节点
  // ============================================
  describe('executeCondition()', () => {
    it('should evaluate conditions and return results', async () => {
      const node: WorkflowNodeDto = {
        id: 'condition1',
        type: 'condition',
        condition: 'x > 0',
      };

      const workflow = createParsedWorkflow(
        [node, { id: 'path1', type: 'task', agentId: 'agent-1' }],
        [
          { from: 'condition1', to: 'path1', condition: true },
        ]
      );

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'condition1',
        nodeType: 'condition',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await executor.executeNode(node, mockExecutionContext, workflow);

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('conditions');
    });

    it('should evaluate multiple edge conditions', async () => {
      const node: WorkflowNodeDto = {
        id: 'condition1',
        type: 'condition',
        condition: 'x > 0',
      };

      const workflow = createParsedWorkflow(
        [
          node,
          { id: 'path1', type: 'task', agentId: 'agent-1' },
          { id: 'path2', type: 'task', agentId: 'agent-2' },
        ],
        [
          { from: 'condition1', to: 'path1', condition: '$value > 10' },
          { from: 'condition1', to: 'path2', condition: '$value <= 10' },
        ]
      );

      const contextWithValue: WorkflowExecutionContext = {
        ...mockExecutionContext,
        variables: { value: 15 },
      };

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'condition1',
        nodeType: 'condition',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await executor.executeNode(node, contextWithValue, workflow);

      expect(result.success).toBe(true);
      expect(result.output.conditions['path1']).toBe(true);
      expect(result.output.conditions['path2']).toBe(false);
    });
  });

  // ============================================
  // executeParallel() - 执行并行节点
  // ============================================
  describe('executeParallel()', () => {
    it('should queue parallel tasks', async () => {
      const node: WorkflowNodeDto = {
        id: 'parallel1',
        type: 'parallel',
      };

      const workflow = createParsedWorkflow(
        [
          node,
          { id: 'task1', type: 'task', agentId: 'agent-1' },
          { id: 'task2', type: 'task', agentId: 'agent-2' },
          { id: 'task3', type: 'task', agentId: 'agent-3' },
        ],
        [
          { from: 'parallel1', to: 'task1' },
          { from: 'parallel1', to: 'task2' },
          { from: 'parallel1', to: 'task3' },
        ]
      );

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'parallel1',
        nodeType: 'parallel',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await executor.executeNode(node, mockExecutionContext, workflow);

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('parallelTasks');
      expect(result.output.parallelTasks).toHaveLength(3);
      expect(result.output).toHaveProperty('count', 3);
    });

    it('should handle parallel node with no outgoing edges', async () => {
      const node: WorkflowNodeDto = {
        id: 'parallel1',
        type: 'parallel',
      };

      const workflow = createParsedWorkflow([node]);

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'parallel1',
        nodeType: 'parallel',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await executor.executeNode(node, mockExecutionContext, workflow);

      expect(result.success).toBe(true);
      expect(result.output.parallelTasks).toHaveLength(0);
      expect(result.output.count).toBe(0);
    });
  });

  // ============================================
  // executeDelay() - 执行延迟节点
  // ============================================
  describe('executeDelay()', () => {
    it('should execute delay node with specified delay', async () => {
      const node: WorkflowNodeDto = {
        id: 'delay1',
        type: 'delay',
        delay: 100,
      };

      const workflow = createParsedWorkflow([node]);

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'delay1',
        nodeType: 'delay',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await executor.executeNode(node, mockExecutionContext, workflow);

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('delayed', 100);
    });

    it('should use config.delay if delay property not set', async () => {
      const node: WorkflowNodeDto = {
        id: 'delay1',
        type: 'delay',
        config: { delay: 200 },
      };

      const workflow = createParsedWorkflow([node]);

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'delay1',
        nodeType: 'delay',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await executor.executeNode(node, mockExecutionContext, workflow);

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('delayed', 200);
    });

    it('should use default delay if not specified', async () => {
      const node: WorkflowNodeDto = {
        id: 'delay1',
        type: 'delay',
      };

      const workflow = createParsedWorkflow([node]);

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'delay1',
        nodeType: 'delay',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await executor.executeNode(node, mockExecutionContext, workflow);

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('delayed', 1000); // default
    });
  });

  // ============================================
  // executeLoop() - 执行循环节点
  // ============================================
  describe('executeLoop()', () => {
    it('should execute loop node with maxIterations', async () => {
      const node: WorkflowNodeDto = {
        id: 'loop1',
        type: 'loop',
        config: { maxIterations: 5 },
      };

      const workflow = createParsedWorkflow([node]);

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'loop1',
        nodeType: 'loop',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await executor.executeNode(node, mockExecutionContext, workflow);

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('maxIterations', 5);
      expect(result.output).toHaveProperty('currentIteration', 0);
      expect(result.output).toHaveProperty('continue', true);
    });

    it('should use default maxIterations if not specified', async () => {
      const node: WorkflowNodeDto = {
        id: 'loop1',
        type: 'loop',
      };

      const workflow = createParsedWorkflow([node]);

      prisma.workflowNodeExecution.create.mockResolvedValue({
        id: 'exec-1',
        instanceId: mockExecutionContext.instanceId,
        nodeId: 'loop1',
        nodeType: 'loop',
        status: 'running',
        input: '{}',
        output: null,
        error: null,
        startedAt: new Date(),
        completedAt: null,
        duration: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      prisma.workflowNodeExecution.update.mockResolvedValue({} as any);

      const result = await executor.executeNode(node, mockExecutionContext, workflow);

      expect(result.success).toBe(true);
      expect(result.output).toHaveProperty('maxIterations', 10); // default
    });
  });

  // ============================================
  // updateContext() - 更新上下文
  // ============================================
  describe('updateContext()', () => {
    it('should update workflow context', async () => {
      prisma.workflowInstance.findUnique.mockResolvedValue({
        id: mockExecutionContext.instanceId,
        context: '{}',
      } as any);

      prisma.workflowInstance.update.mockResolvedValue({} as any);

      await executor.updateContext(mockExecutionContext.instanceId, { newVar: 'value' });

      expect(prisma.workflowInstance.update).toHaveBeenCalledWith({
        where: { id: mockExecutionContext.instanceId },
        data: { context: JSON.stringify({ newVar: 'value' }) },
      });
    });

    it('should merge with existing context', async () => {
      prisma.workflowInstance.findUnique.mockResolvedValue({
        id: mockExecutionContext.instanceId,
        context: JSON.stringify({ existingVar: 'existing' }),
      } as any);

      prisma.workflowInstance.update.mockResolvedValue({} as any);

      await executor.updateContext(mockExecutionContext.instanceId, { newVar: 'value' });

      expect(prisma.workflowInstance.update).toHaveBeenCalledWith({
        where: { id: mockExecutionContext.instanceId },
        data: { context: JSON.stringify({ existingVar: 'existing', newVar: 'value' }) },
      });
    });

    it('should throw error if instance not found', async () => {
      prisma.workflowInstance.findUnique.mockResolvedValue(null);

      await expect(
        executor.updateContext('nonexistent', { newVar: 'value' })
      ).rejects.toThrow('not found');
    });
  });
});
