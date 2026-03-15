import { WorkflowParser } from './workflow.parser';
import { WorkflowDefinitionDto, WorkflowNodeDto, WorkflowEdgeDto } from '../dto/workflow.dto';
import { BadRequestException } from '@nestjs/common';

describe('WorkflowParser', () => {
  let parser: WorkflowParser;

  beforeEach(() => {
    parser = new WorkflowParser();
  });

  // ============================================
  // Helper: Create valid workflow definition
  // ============================================
  const createValidWorkflow = (
    nodes?: Partial<WorkflowNodeDto>[],
    edges?: Partial<WorkflowEdgeDto>[]
  ): WorkflowDefinitionDto => {
    const defaultNodes: WorkflowNodeDto[] = [
      { id: 'start', type: 'start' },
      { id: 'task1', type: 'task', agentId: 'agent-1' },
      { id: 'end', type: 'end' },
    ];

    const defaultEdges: WorkflowEdgeDto[] = [
      { from: 'start', to: 'task1' },
      { from: 'task1', to: 'end' },
    ];

    const mergedNodes = nodes
      ? nodes.map((n, i) => ({ ...defaultNodes[i], ...n }) as WorkflowNodeDto)
      : defaultNodes;

    const mergedEdges = edges
      ? edges.map((e, i) => ({ ...defaultEdges[i], ...e }) as WorkflowEdgeDto)
      : defaultEdges;

    return {
      nodes: mergedNodes,
      edges: mergedEdges,
    };
  };

  // ============================================
  // parse() - 解析工作流定义
  // ============================================
  describe('parse()', () => {
    it('should parse a valid simple workflow', () => {
      const definition = createValidWorkflow();
      const result = parser.parse(definition);

      expect(result).toBeDefined();
      expect(result.nodes).toBeInstanceOf(Map);
      expect(result.nodes.size).toBe(3);
      expect(result.startNode).toBe('start');
      expect(result.endNodes).toContain('end');
    });

    it('should parse workflow with multiple tasks', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'task1', type: 'task', agentId: 'agent-1' },
          { id: 'task2', type: 'task', agentId: 'agent-2' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'task1' },
          { from: 'task1', to: 'task2' },
          { from: 'task2', to: 'end' },
        ],
      };

      const result = parser.parse(definition);

      expect(result.nodes.size).toBe(4);
      expect(result.adjacencyList.get('start')).toContain('task1');
      expect(result.adjacencyList.get('task1')).toContain('task2');
    });

    it('should throw error for duplicate node IDs', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'start', type: 'end' }, // duplicate
        ],
        edges: [],
      };

      expect(() => parser.parse(definition)).toThrow(BadRequestException);
      expect(() => parser.parse(definition)).toThrow('Duplicate node ID');
    });

    it('should throw error when start node is missing', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'task1', type: 'task', agentId: 'agent-1' },
          { id: 'end', type: 'end' },
        ],
        edges: [{ from: 'task1', to: 'end' }],
      };

      expect(() => parser.parse(definition)).toThrow(BadRequestException);
      expect(() => parser.parse(definition)).toThrow('must have a start node');
    });

    it('should throw error when end node is missing', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'task1', type: 'task', agentId: 'agent-1' },
        ],
        edges: [{ from: 'start', to: 'task1' }],
      };

      expect(() => parser.parse(definition)).toThrow(BadRequestException);
      expect(() => parser.parse(definition)).toThrow('must have at least one end node');
    });

    it('should throw error for multiple start nodes', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start1', type: 'start' },
          { id: 'start2', type: 'start' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start1', to: 'end' },
          { from: 'start2', to: 'end' },
        ],
      };

      expect(() => parser.parse(definition)).toThrow(BadRequestException);
      expect(() => parser.parse(definition)).toThrow('only have one start node');
    });

    it('should support multiple end nodes', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'condition1', type: 'condition', condition: 'x > 0' },
          { id: 'end1', type: 'end' },
          { id: 'end2', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'condition1' },
          { from: 'condition1', to: 'end1', condition: true },
          { from: 'condition1', to: 'end2', condition: false },
        ],
      };

      const result = parser.parse(definition);

      expect(result.endNodes).toHaveLength(2);
      expect(result.endNodes).toContain('end1');
      expect(result.endNodes).toContain('end2');
    });

    it('should build correct adjacency list', () => {
      const definition = createValidWorkflow();
      const result = parser.parse(definition);

      expect(result.adjacencyList).toBeInstanceOf(Map);
      expect(result.adjacencyList.get('start')).toEqual(['task1']);
      expect(result.adjacencyList.get('task1')).toEqual(['end']);
    });

    it('should throw error for unreachable nodes', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'task1', type: 'task', agentId: 'agent-1' },
          { id: 'orphan', type: 'task', agentId: 'agent-2' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'task1' },
          { from: 'task1', to: 'end' },
          // orphan has no incoming edge
        ],
      };

      expect(() => parser.parse(definition)).toThrow(BadRequestException);
      expect(() => parser.parse(definition)).toThrow('not reachable from start');
    });
  });

  // ============================================
  // validateNode() - 验证节点
  // ============================================
  describe('validateNode()', () => {
    it('should validate task node with agentId', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'task1', type: 'task', agentId: 'agent-1' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'task1' },
          { from: 'task1', to: 'end' },
        ],
      };

      expect(() => parser.parse(definition)).not.toThrow();
    });

    it('should validate task node with agentId in config', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'task1', type: 'task', config: { agentId: 'agent-1' } },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'task1' },
          { from: 'task1', to: 'end' },
        ],
      };

      expect(() => parser.parse(definition)).not.toThrow();
    });

    it('should throw error for task node without agentId', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'task1', type: 'task' as any },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'task1' },
          { from: 'task1', to: 'end' },
        ],
      };

      expect(() => parser.parse(definition)).toThrow(BadRequestException);
      expect(() => parser.parse(definition)).toThrow('must have an agentId');
    });

    it('should validate condition node with condition', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'condition1', type: 'condition', condition: 'value > 0' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'condition1' },
          { from: 'condition1', to: 'end', condition: true },
        ],
      };

      expect(() => parser.parse(definition)).not.toThrow();
    });

    it('should throw error for condition node without condition', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'condition1', type: 'condition' as any },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'condition1' },
          { from: 'condition1', to: 'end' },
        ],
      };

      expect(() => parser.parse(definition)).toThrow(BadRequestException);
      expect(() => parser.parse(definition)).toThrow('must have a condition expression');
    });

    it('should validate delay node with positive delay', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'delay1', type: 'delay', delay: 1000 },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'delay1' },
          { from: 'delay1', to: 'end' },
        ],
      };

      expect(() => parser.parse(definition)).not.toThrow();
    });

    it('should throw error for delay node with zero delay', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'delay1', type: 'delay', delay: 0 },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'delay1' },
          { from: 'delay1', to: 'end' },
        ],
      };

      expect(() => parser.parse(definition)).toThrow(BadRequestException);
      expect(() => parser.parse(definition)).toThrow('must have a positive delay value');
    });

    it('should throw error for delay node without delay', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'delay1', type: 'delay' as any },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'delay1' },
          { from: 'delay1', to: 'end' },
        ],
      };

      expect(() => parser.parse(definition)).toThrow(BadRequestException);
      expect(() => parser.parse(definition)).toThrow('must have a positive delay value');
    });

    it('should validate loop node with maxIterations', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'loop1', type: 'loop', config: { maxIterations: 10 } },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'loop1' },
          { from: 'loop1', to: 'end' },
        ],
      };

      expect(() => parser.parse(definition)).not.toThrow();
    });

    it('should throw error for loop node without maxIterations', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'loop1', type: 'loop' as any },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'loop1' },
          { from: 'loop1', to: 'end' },
        ],
      };

      expect(() => parser.parse(definition)).toThrow(BadRequestException);
      expect(() => parser.parse(definition)).toThrow('must have maxIterations');
    });

    it('should validate parallel node', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'parallel1', type: 'parallel' },
          { id: 'task1', type: 'task', agentId: 'agent-1' },
          { id: 'task2', type: 'task', agentId: 'agent-2' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'parallel1' },
          { from: 'parallel1', to: 'task1' },
          { from: 'parallel1', to: 'task2' },
          { from: 'task1', to: 'end' },
          { from: 'task2', to: 'end' },
        ],
      };

      expect(() => parser.parse(definition)).not.toThrow();
    });
  });

  // ============================================
  // validateEdge() - 验证边
  // ============================================
  describe('validateEdge()', () => {
    it('should validate edge with existing nodes', () => {
      const definition = createValidWorkflow();
      expect(() => parser.parse(definition)).not.toThrow();
    });

    it('should throw error for edge with non-existent source node', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'end', type: 'end' },
        ],
        edges: [{ from: 'nonexistent', to: 'end' }],
      };

      expect(() => parser.parse(definition)).toThrow(BadRequestException);
      expect(() => parser.parse(definition)).toThrow('source node not found');
    });

    it('should throw error for edge with non-existent target node', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'end', type: 'end' },
        ],
        edges: [{ from: 'start', to: 'nonexistent' }],
      };

      expect(() => parser.parse(definition)).toThrow(BadRequestException);
      expect(() => parser.parse(definition)).toThrow('target node not found');
    });

    it('should support edges with boolean conditions', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'condition1', type: 'condition', condition: 'x > 0' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'condition1' },
          { from: 'condition1', to: 'end', condition: true },
        ],
      };

      expect(() => parser.parse(definition)).not.toThrow();
    });

    it('should support edges with string conditions', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'condition1', type: 'condition', condition: 'x > 0' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'condition1' },
          { from: 'condition1', to: 'end', condition: '$value > 10' },
        ],
      };

      expect(() => parser.parse(definition)).not.toThrow();
    });
  });

  // ============================================
  // findTerminalNodes() - 查找终端节点
  // ============================================
  describe('findTerminalNodes()', () => {
    it('should find single start and end nodes', () => {
      const definition = createValidWorkflow();
      const result = parser.parse(definition);

      expect(result.startNode).toBe('start');
      expect(result.endNodes).toHaveLength(1);
      expect(result.endNodes[0]).toBe('end');
    });

    it('should find multiple end nodes', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'condition1', type: 'condition', condition: 'x > 0' },
          { id: 'end1', type: 'end' },
          { id: 'end2', type: 'end' },
          { id: 'end3', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'condition1' },
          { from: 'condition1', to: 'end1', condition: true },
          { from: 'condition1', to: 'end2', condition: false },
          { from: 'condition1', to: 'end3', condition: '$x === 0' },
        ],
      };

      const result = parser.parse(definition);

      expect(result.endNodes).toHaveLength(3);
    });

    it('should identify start node correctly', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'custom-start', type: 'start' },
          { id: 'task1', type: 'task', agentId: 'agent-1' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'custom-start', to: 'task1' },
          { from: 'task1', to: 'end' },
        ],
      };

      const result = parser.parse(definition);
      expect(result.startNode).toBe('custom-start');
    });
  });

  // ============================================
  // getNextNodes() - 获取下一节点
  // ============================================
  describe('getNextNodes()', () => {
    it('should return all outgoing edges when no condition', () => {
      const definition = createValidWorkflow();
      const parsed = parser.parse(definition);
      const nextNodes = parser.getNextNodes('start', parsed.edges, {});

      expect(nextNodes).toHaveLength(1);
      expect(nextNodes[0].to).toBe('task1');
    });

    it('should filter edges based on boolean condition', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'condition1', type: 'condition', condition: 'x > 0' },
          { id: 'path1', type: 'task', agentId: 'agent-1' },
          { id: 'path2', type: 'task', agentId: 'agent-2' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'condition1' },
          { from: 'condition1', to: 'path1', condition: true },
          { from: 'condition1', to: 'path2', condition: false },
          { from: 'path1', to: 'end' },
          { from: 'path2', to: 'end' },
        ],
      };

      const parsed = parser.parse(definition);
      const nextNodes = parser.getNextNodes('condition1', parsed.edges, {});

      expect(nextNodes).toHaveLength(1);
      expect(nextNodes[0].to).toBe('path1');
    });

    it('should evaluate string conditions with context', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'condition1', type: 'condition', condition: 'x > 0' },
          { id: 'path1', type: 'task', agentId: 'agent-1' },
          { id: 'path2', type: 'task', agentId: 'agent-2' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'condition1' },
          { from: 'condition1', to: 'path1', condition: '$value > 10' },
          { from: 'condition1', to: 'path2', condition: '$value <= 10' },
          { from: 'path1', to: 'end' },
          { from: 'path2', to: 'end' },
        ],
      };

      const parsed = parser.parse(definition);

      // Test with value > 10
      const nextNodes1 = parser.getNextNodes('condition1', parsed.edges, { value: 15 });
      expect(nextNodes1).toHaveLength(1);
      expect(nextNodes1[0].to).toBe('path1');

      // Test with value <= 10
      const nextNodes2 = parser.getNextNodes('condition1', parsed.edges, { value: 5 });
      expect(nextNodes2).toHaveLength(1);
      expect(nextNodes2[0].to).toBe('path2');
    });

    it('should return empty array for node with no outgoing edges', () => {
      const definition = createValidWorkflow();
      const parsed = parser.parse(definition);
      const nextNodes = parser.getNextNodes('end', parsed.edges, {});

      expect(nextNodes).toHaveLength(0);
    });
  });

  // ============================================
  // Cycle Detection
  // ============================================
  describe('cycle detection', () => {
    it('should throw error for invalid cycle', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'task1', type: 'task', agentId: 'agent-1' },
          { id: 'task2', type: 'task', agentId: 'agent-2' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'task1' },
          { from: 'task1', to: 'task2' },
          { from: 'task2', to: 'task1' }, // Creates cycle
          { from: 'task2', to: 'end' },
        ],
      };

      expect(() => parser.parse(definition)).toThrow(BadRequestException);
      expect(() => parser.parse(definition)).toThrow('invalid cycle');
    });

    it('should allow cycles in loop nodes', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'loop1', type: 'loop', config: { maxIterations: 10 } },
          { id: 'task1', type: 'task', agentId: 'agent-1' },
          { id: 'end', type: 'end' },
        ],
        edges: [
          { from: 'start', to: 'loop1' },
          { from: 'loop1', to: 'task1' },
          { from: 'task1', to: 'loop1' }, // Back edge to loop
          { from: 'task1', to: 'end' },
        ],
      };

      // Should not throw because loop nodes allow cycles
      expect(() => parser.parse(definition)).not.toThrow();
    });
  });

  // ============================================
  // Complex Workflow Tests
  // ============================================
  describe('complex workflows', () => {
    it('should parse workflow with all node types', () => {
      const definition: WorkflowDefinitionDto = {
        nodes: [
          { id: 'start', type: 'start' },
          { id: 'task1', type: 'task', agentId: 'agent-1' },
          { id: 'condition1', type: 'condition', condition: 'x > 0' },
          { id: 'parallel1', type: 'parallel' },
          { id: 'delay1', type: 'delay', delay: 1000 },
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

      const result = parser.parse(definition);

      expect(result.nodes.size).toBe(7);
      expect(result.edges.size).toBeGreaterThan(0);
    });
  });
});
