import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowEngine } from './engine/workflow.engine';
import { WorkflowParser } from './parser/workflow.parser';
import { WorkflowExecutor } from './executor/workflow.executor';
import { PrismaService } from '../common/prisma/prisma.service';
import { WorkflowDefinitionDto } from './dto/workflow.dto';

/**
 * 场景测试 - 测试各种工作流类型的端到端执行
 */
describe('Workflow Scenarios', () => {
  let engine: WorkflowEngine;
  let parser: WorkflowParser;
  let prisma: any;

  const mockTemplate = {
    id: 'template-1',
    name: 'Test Workflow',
    description: 'Test',
    category: 'test',
    version: '1.0.0',
    definition: '',
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
    parser = module.get(WorkflowParser);
    prisma = module.get(PrismaService);
  });

  // Helper to setup mocks for workflow execution
  const setupExecutionMocks = (template: any, instance: any) => {
    prisma.workflowTemplate.findUnique.mockResolvedValue(template as any);
    prisma.workflowInstance.create.mockResolvedValue(instance as any);
    prisma.workflowTemplate.update.mockResolvedValue(template as any);
    prisma.workflowInstance.update.mockResolvedValue({} as any);
    prisma.workflowInstance.findUnique.mockResolvedValue({
      ...instance,
      status: 'running',
    } as any);
    prisma.workflowNodeExecution.create.mockResolvedValue({
      id: 'exec-1',
      instanceId: instance.id,
      nodeId: 'test',
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
  };

  // ============================================
  // 串行工作流 (Serial Workflow)
  // ============================================
  describe('Serial Workflow', () => {
    const serialWorkflowDefinition: WorkflowDefinitionDto = {
      nodes: [
        { id: 'start', type: 'start' },
        { id: 'task1', type: 'task', agentId: 'agent-1', config: { name: 'Data Fetch' } },
        { id: 'task2', type: 'task', agentId: 'agent-2', config: { name: 'Data Process' } },
        { id: 'task3', type: 'task', agentId: 'agent-3', config: { name: 'Data Store' } },
        { id: 'end', type: 'end' },
      ],
      edges: [
        { from: 'start', to: 'task1' },
        { from: 'task1', to: 'task2' },
        { from: 'task2', to: 'task3' },
        { from: 'task3', to: 'end' },
      ],
    };

    it('should parse serial workflow correctly', () => {
      const result = parser.parse(serialWorkflowDefinition);

      expect(result.nodes.size).toBe(5);
      expect(result.startNode).toBe('start');
      expect(result.endNodes).toEqual(['end']);

      // Verify execution order
      expect(result.adjacencyList.get('start')).toEqual(['task1']);
      expect(result.adjacencyList.get('task1')).toEqual(['task2']);
      expect(result.adjacencyList.get('task2')).toEqual(['task3']);
      expect(result.adjacencyList.get('task3')).toEqual(['end']);
    });

    it('should execute serial workflow in order', async () => {
      const template = {
        ...mockTemplate,
        definition: JSON.stringify(serialWorkflowDefinition),
      };

      setupExecutionMocks(template, mockInstance);

      const instanceId = await engine.startWorkflow('template-1');

      expect(instanceId).toBeDefined();
      expect(prisma.workflowInstance.create).toHaveBeenCalled();
    });

    it('should pass context between tasks in serial workflow', async () => {
      const result = parser.parse(serialWorkflowDefinition);

      // Context should flow: start -> task1 -> task2 -> task3 -> end
      expect(result.adjacencyList.size).toBe(4);
    });

    it('should handle delay in serial workflow', () => {
      const delayedSerialWorkflow: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'task1', type: 'task', agentId: 'agent-1' },
          { id: 'delay1', type: 'delay', delay: 100 },
          { id: 'task2', type: 'task', agentId: 'agent-2' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'task1' },
          { from: 'task1', to: 'delay1' },
          { from: 'delay1', to: 'task2' },
          { from: 'task2', to: 'end' },
        ],
      };

      expect(() => parser.parse(delayedSerialWorkflow)).not.toThrow();
    });
  });

  // ============================================
  // 并行工作流 (Parallel Workflow)
  // ============================================
  describe('Parallel Workflow', () => {
    const parallelWorkflowDefinition: WorkflowDefinitionDto = {
      nodes: [
        { id: 'start', type: 'start' },
        { id: 'parallel1', type: 'parallel' },
        { id: 'task1', type: 'task', agentId: 'agent-1', config: { name: 'Task A' } },
        { id: 'task2', type: 'task', agentId: 'agent-2', config: { name: 'Task B' } },
        { id: 'task3', type: 'task', agentId: 'agent-3', config: { name: 'Task C' } },
        { id: 'end', type: 'end' },
      ],
      edges: [
        { from: 'start', to: 'parallel1' },
        { from: 'parallel1', to: 'task1' },
        { from: 'parallel1', to: 'task2' },
        { from: 'parallel1', to: 'task3' },
        { from: 'task1', to: 'end' },
        { from: 'task2', to: 'end' },
        { from: 'task3', to: 'end' },
      ],
    };

    it('should parse parallel workflow correctly', () => {
      const result = parser.parse(parallelWorkflowDefinition);

      expect(result.nodes.size).toBe(6);
      expect(result.adjacencyList.get('parallel1')).toHaveLength(3);
      expect(result.adjacencyList.get('parallel1')).toContain('task1');
      expect(result.adjacencyList.get('parallel1')).toContain('task2');
      expect(result.adjacencyList.get('parallel1')).toContain('task3');
    });

    it('should identify parallel branches', () => {
      const result = parser.parse(parallelWorkflowDefinition);

      // All parallel tasks should converge to end
      expect(result.adjacencyList.get('task1')).toEqual(['end']);
      expect(result.adjacencyList.get('task2')).toEqual(['end']);
      expect(result.adjacencyList.get('task3')).toEqual(['end']);
    });

    it('should execute parallel workflow', async () => {
      const template = {
        ...mockTemplate,
        definition: JSON.stringify(parallelWorkflowDefinition),
      };

      setupExecutionMocks(template, mockInstance);

      const instanceId = await engine.startWorkflow('template-1');

      expect(instanceId).toBeDefined();
    });

    it('should support nested parallel nodes', () => {
      const nestedParallelWorkflow: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'parallel1', type: 'parallel' },
          { id: 'parallel2', type: 'parallel' },
          { id: 'task1', type: 'task', agentId: 'agent-1' },
          { id: 'task2', type: 'task', agentId: 'agent-2' },
          { id: 'task3', type: 'task', agentId: 'agent-3' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'parallel1' },
          { from: 'parallel1', to: 'parallel2' },
          { from: 'parallel1', to: 'task3' },
          { from: 'parallel2', to: 'task1' },
          { from: 'parallel2', to: 'task2' },
          { from: 'task1', to: 'end' },
          { from: 'task2', to: 'end' },
          { from: 'task3', to: 'end' },
        ],
      };

      expect(() => parser.parse(nestedParallelWorkflow)).not.toThrow();
    });
  });

  // ============================================
  // 条件分支工作流 (Conditional Workflow)
  // ============================================
  describe('Conditional Workflow', () => {
    const conditionalWorkflowDefinition: WorkflowDefinitionDto = {
      nodes: [
        { id: 'start', type: 'start' },
        { id: 'condition1', type: 'condition', condition: '$score >= 80' },
        { id: 'task-high', type: 'task', agentId: 'agent-1', config: { name: 'High Score Handler' } },
        { id: 'task-low', type: 'task', agentId: 'agent-2', config: { name: 'Low Score Handler' } },
        { id: 'end', type: 'end' },
      ],
      edges: [
        { from: 'start', to: 'condition1' },
        { from: 'condition1', to: 'task-high', condition: '$score >= 80' },
        { from: 'condition1', to: 'task-low', condition: '$score < 80' },
        { from: 'task-high', to: 'end' },
        { from: 'task-low', to: 'end' },
      ],
    };

    it('should parse conditional workflow correctly', () => {
      const result = parser.parse(conditionalWorkflowDefinition);

      expect(result.nodes.size).toBe(5);
      expect(result.nodes.get('condition1')?.type).toBe('condition');
    });

    it('should evaluate true condition', () => {
      const result = parser.parse(conditionalWorkflowDefinition);

      const nextNodes = parser.getNextNodes('condition1', result.edges, { score: 90 });

      // Should take high score path
      const highScorePath = nextNodes.find(n => n.to === 'task-high');
      expect(highScorePath).toBeDefined();
    });

    it('should evaluate false condition', () => {
      const result = parser.parse(conditionalWorkflowDefinition);

      const nextNodes = parser.getNextNodes('condition1', result.edges, { score: 70 });

      // Should take low score path
      const lowScorePath = nextNodes.find(n => n.to === 'task-low');
      expect(lowScorePath).toBeDefined();
    });

    it('should handle multiple conditions', () => {
      const multiConditionWorkflow: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'condition1', type: 'condition', condition: '$value' },
          { id: 'path-a', type: 'task', agentId: 'agent-1' },
          { id: 'path-b', type: 'task', agentId: 'agent-2' },
          { id: 'path-c', type: 'task', agentId: 'agent-3' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'condition1' },
          { from: 'condition1', to: 'path-a', condition: '$value < 33' },
          { from: 'condition1', to: 'path-b', condition: '$value >= 33 && $value < 66' },
          { from: 'condition1', to: 'path-c', condition: '$value >= 66' },
          { from: 'path-a', to: 'end' },
          { from: 'path-b', to: 'end' },
          { from: 'path-c', to: 'end' },
        ],
      };

      const result = parser.parse(multiConditionWorkflow);

      // Test different values
      const nextNodes1 = parser.getNextNodes('condition1', result.edges, { value: 20 });
      expect(nextNodes1.find(n => n.to === 'path-a')).toBeDefined();

      const nextNodes2 = parser.getNextNodes('condition1', result.edges, { value: 50 });
      expect(nextNodes2.find(n => n.to === 'path-b')).toBeDefined();

      const nextNodes3 = parser.getNextNodes('condition1', result.edges, { value: 80 });
      expect(nextNodes3.find(n => n.to === 'path-c')).toBeDefined();
    });

    it('should execute conditional workflow', async () => {
      const template = {
        ...mockTemplate,
        definition: JSON.stringify(conditionalWorkflowDefinition),
      };

      setupExecutionMocks(template, {
        ...mockInstance,
        context: JSON.stringify({ score: 90 }),
      });

      const instanceId = await engine.startWorkflow('template-1', undefined, { score: 90 });

      expect(instanceId).toBeDefined();
    });
  });

  // ============================================
  // 循环工作流 (Loop Workflow)
  // ============================================
  describe('Loop Workflow', () => {
    const loopWorkflowDefinition: WorkflowDefinitionDto = {
      nodes: [
        { id: 'start', type: 'start' },
        { id: 'loop1', type: 'loop', config: { maxIterations: 5 } },
        { id: 'task1', type: 'task', agentId: 'agent-1', config: { name: 'Process Item' } },
        { id: 'end', type: 'end' },
      ],
      edges: [
        { from: 'start', to: 'loop1' },
        { from: 'loop1', to: 'task1' },
        { from: 'task1', to: 'loop1' }, // Loop back
        { from: 'task1', to: 'end' }, // Exit loop
      ],
    };

    it('should parse loop workflow correctly', () => {
      const result = parser.parse(loopWorkflowDefinition);

      expect(result.nodes.size).toBe(4);
      expect(result.nodes.get('loop1')?.type).toBe('loop');
      expect(result.nodes.get('loop1')?.config?.maxIterations).toBe(5);
    });

    it('should allow cycles in loop nodes', () => {
      // This should not throw because loop nodes allow cycles
      expect(() => parser.parse(loopWorkflowDefinition)).not.toThrow();
    });

    it('should validate maxIterations is present', () => {
      const invalidLoopWorkflow: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'loop1', type: 'loop' as any }, // Missing maxIterations
          { id: 'task1', type: 'task', agentId: 'agent-1' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'loop1' },
          { from: 'loop1', to: 'task1' },
          { from: 'task1', to: 'end' },
        ],
      };

      expect(() => parser.parse(invalidLoopWorkflow)).toThrow('must have maxIterations');
    });

    it('should execute loop workflow', async () => {
      const template = {
        ...mockTemplate,
        definition: JSON.stringify(loopWorkflowDefinition),
      };

      setupExecutionMocks(template, mockInstance);

      // Increase timeout for this test
      const instanceId = await engine.startWorkflow('template-1');

      expect(instanceId).toBeDefined();
    }, 60000);

    it('should support nested loops', () => {
      const nestedLoopWorkflow: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'outer-loop', type: 'loop', config: { maxIterations: 3 } },
          { id: 'inner-loop', type: 'loop', config: { maxIterations: 5 } },
          { id: 'task1', type: 'task', agentId: 'agent-1' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'outer-loop' },
          { from: 'outer-loop', to: 'inner-loop' },
          { from: 'inner-loop', to: 'task1' },
          { from: 'task1', to: 'inner-loop' },
          { from: 'task1', to: 'outer-loop' },
          { from: 'task1', to: 'end' },
        ],
      };

      expect(() => parser.parse(nestedLoopWorkflow)).not.toThrow();
    });
  });

  // ============================================
  // 复杂工作流 (Complex Workflow)
  // ============================================
  describe('Complex Workflow', () => {
    const complexWorkflowDefinition: WorkflowDefinitionDto = {
      nodes: [
        { id: 'start', type: 'start' },
        { id: 'parallel1', type: 'parallel' },
        { id: 'task1', type: 'task', agentId: 'agent-1' },
        { id: 'task2', type: 'task', agentId: 'agent-2' },
        { id: 'condition1', type: 'condition', condition: '$needsReview' },
        { id: 'review', type: 'task', agentId: 'agent-3' },
        { id: 'skip-review', type: 'task', agentId: 'agent-4' },
        { id: 'delay1', type: 'delay', delay: 100 },
        { id: 'end', type: 'end' },
      ],
      edges: [
        { from: 'start', to: 'parallel1' },
        { from: 'parallel1', to: 'task1' },
        { from: 'parallel1', to: 'task2' },
        { from: 'task1', to: 'condition1' },
        { from: 'task2', to: 'condition1' },
        { from: 'condition1', to: 'review', condition: '$needsReview === true' },
        { from: 'condition1', to: 'skip-review', condition: '$needsReview === false' },
        { from: 'review', to: 'delay1' },
        { from: 'skip-review', to: 'delay1' },
        { from: 'delay1', to: 'end' },
      ],
    };

    it('should parse complex workflow', () => {
      const result = parser.parse(complexWorkflowDefinition);

      expect(result.nodes.size).toBe(9);
      expect(result.startNode).toBe('start');
      expect(result.endNodes).toEqual(['end']);
    });

    it('should have correct adjacency for parallel section', () => {
      const result = parser.parse(complexWorkflowDefinition);

      expect(result.adjacencyList.get('parallel1')).toHaveLength(2);
      expect(result.adjacencyList.get('parallel1')).toContain('task1');
      expect(result.adjacencyList.get('parallel1')).toContain('task2');
    });

    it('should have correct adjacency for condition section', () => {
      const result = parser.parse(complexWorkflowDefinition);

      // Both task1 and task2 should point to condition1
      expect(result.adjacencyList.get('task1')).toEqual(['condition1']);
      expect(result.adjacencyList.get('task2')).toEqual(['condition1']);
    });

    it('should converge to delay1 before end', () => {
      const result = parser.parse(complexWorkflowDefinition);

      expect(result.adjacencyList.get('review')).toEqual(['delay1']);
      expect(result.adjacencyList.get('skip-review')).toEqual(['delay1']);
      expect(result.adjacencyList.get('delay1')).toEqual(['end']);
    });

    it('should execute complex workflow', async () => {
      const template = {
        ...mockTemplate,
        definition: JSON.stringify(complexWorkflowDefinition),
      };

      setupExecutionMocks(template, {
        ...mockInstance,
        context: JSON.stringify({ needsReview: true }),
      });

      const instanceId = await engine.startWorkflow('template-1', undefined, {
        needsReview: true,
      });

      expect(instanceId).toBeDefined();
    });
  });

  // ============================================
  // Error Handling Scenarios
  // ============================================
  describe('Error Handling', () => {
    it('should handle invalid workflow definition', () => {
      const invalidDefinition: WorkflowDefinitionDto = {
        nodes: [],
        edges: [],
      };

      expect(() => parser.parse(invalidDefinition)).toThrow();
    });

    it('should detect unreachable nodes', () => {
      const unreachableNodeWorkflow: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'end', type: 'end' },
          { id: 'orphan', type: 'task', agentId: 'agent-1' },
        ],
        edges: [{ from: 'start', to: 'end' }],
      };

      expect(() => parser.parse(unreachableNodeWorkflow)).toThrow('not reachable');
    });

    it('should detect missing required node properties', () => {
      const missingPropertiesWorkflow: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'task1', type: 'task' as any }, // Missing agentId
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'task1' },
          { from: 'task1', to: 'end' },
        ],
      };

      expect(() => parser.parse(missingPropertiesWorkflow)).toThrow('must have an agentId');
    });
  });

  // ============================================
  // Workflow Validation Scenarios
  // ============================================
  describe('Workflow Validation', () => {
    it('should validate all node types', () => {
      const allTypesWorkflow: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'task1', type: 'task', agentId: 'agent-1' },
          { id: 'condition1', type: 'condition', condition: 'true' },
          { id: 'parallel1', type: 'parallel' },
          { id: 'delay1', type: 'delay', delay: 100 },
          { id: 'loop1', type: 'loop', config: { maxIterations: 5 } },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'task1' },
          { from: 'task1', to: 'condition1' },
          { from: 'condition1', to: 'parallel1', condition: true },
          { from: 'condition1', to: 'delay1', condition: false },
          { from: 'parallel1', to: 'loop1' },
          { from: 'delay1', to: 'loop1' },
          { from: 'loop1', to: 'end' },
        ],
      };

      const result = parser.parse(allTypesWorkflow);

      expect(result.nodes.size).toBe(7);
      expect(result.nodes.get('start')?.type).toBe('start');
      expect(result.nodes.get('task1')?.type).toBe('task');
      expect(result.nodes.get('condition1')?.type).toBe('condition');
      expect(result.nodes.get('parallel1')?.type).toBe('parallel');
      expect(result.nodes.get('delay1')?.type).toBe('delay');
      expect(result.nodes.get('loop1')?.type).toBe('loop');
      expect(result.nodes.get('end')?.type).toBe('end');
    });

    it('should support large workflows', () => {
      const nodes: any[] = [{ id: 'start', type: 'start' }];
      const edges: any[] = [];

      // Create 50 tasks in sequence
      for (let i = 1; i <= 50; i++) {
        nodes.push({ id: `task${i}`, type: 'task', agentId: `agent-${i}` });
        if (i === 1) {
          edges.push({ from: 'start', to: 'task1' });
        } else {
          edges.push({ from: `task${i - 1}`, to: `task${i}` });
        }
      }
      nodes.push({ id: 'end', type: 'end' });
      edges.push({ from: 'task50', to: 'end' });

      const largeWorkflow: WorkflowDefinitionDto = { nodes, edges };

      const result = parser.parse(largeWorkflow);
      expect(result.nodes.size).toBe(52);
    });
  });
});
