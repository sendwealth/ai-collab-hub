import { WorkflowDefinitionDto, WorkflowNodeDto, WorkflowEdgeDto } from '../dto/workflow.dto';

/**
 * Mock workflow data for testing
 */

// ============================================
// Node Templates
// ============================================
export const mockStartNode: WorkflowNodeDto = {
  id: 'start',
  type: 'start',
};

export const mockEndNode: WorkflowNodeDto = {
  id: 'end',
  type: 'end',
};

export const mockTaskNode = (id: string, agentId: string, config?: Record<string, any>): WorkflowNodeDto => ({
  id,
  type: 'task',
  agentId,
  config,
});

export const mockConditionNode = (id: string, condition: string): WorkflowNodeDto => ({
  id,
  type: 'condition',
  condition,
});

export const mockParallelNode = (id: string): WorkflowNodeDto => ({
  id,
  type: 'parallel',
});

export const mockDelayNode = (id: string, delay: number): WorkflowNodeDto => ({
  id,
  type: 'delay',
  delay,
});

export const mockLoopNode = (id: string, maxIterations: number): WorkflowNodeDto => ({
  id,
  type: 'loop',
  config: { maxIterations },
});

// ============================================
// Edge Templates
// ============================================
export const mockEdge = (from: string, to: string, condition?: boolean | string): WorkflowEdgeDto => ({
  from,
  to,
  condition,
});

// ============================================
// Workflow Definitions
// ============================================

/**
 * Simple linear workflow: start -> task -> end
 */
export const simpleLinearWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    mockTaskNode('task1', 'agent-1'),
    mockEndNode,
  ],
  edges: [
    mockEdge('start', 'task1'),
    mockEdge('task1', 'end'),
  ],
};

/**
 * Serial workflow with multiple tasks
 */
export const serialWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    mockTaskNode('task1', 'agent-1', { name: 'Initialize' }),
    mockTaskNode('task2', 'agent-2', { name: 'Process' }),
    mockTaskNode('task3', 'agent-3', { name: 'Finalize' }),
    mockEndNode,
  ],
  edges: [
    mockEdge('start', 'task1'),
    mockEdge('task1', 'task2'),
    mockEdge('task2', 'task3'),
    mockEdge('task3', 'end'),
  ],
};

/**
 * Parallel workflow with concurrent tasks
 */
export const parallelWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    mockParallelNode('parallel1'),
    mockTaskNode('task-a', 'agent-1', { name: 'Task A' }),
    mockTaskNode('task-b', 'agent-2', { name: 'Task B' }),
    mockTaskNode('task-c', 'agent-3', { name: 'Task C' }),
    mockEndNode,
  ],
  edges: [
    mockEdge('start', 'parallel1'),
    mockEdge('parallel1', 'task-a'),
    mockEdge('parallel1', 'task-b'),
    mockEdge('parallel1', 'task-c'),
    mockEdge('task-a', 'end'),
    mockEdge('task-b', 'end'),
    mockEdge('task-c', 'end'),
  ],
};

/**
 * Conditional workflow with branching
 */
export const conditionalWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    mockConditionNode('condition1', '$score >= 80'),
    mockTaskNode('high-score', 'agent-1', { name: 'High Score Handler' }),
    mockTaskNode('low-score', 'agent-2', { name: 'Low Score Handler' }),
    mockEndNode,
  ],
  edges: [
    mockEdge('start', 'condition1'),
    mockEdge('condition1', 'high-score', '$score >= 80'),
    mockEdge('condition1', 'low-score', '$score < 80'),
    mockEdge('high-score', 'end'),
    mockEdge('low-score', 'end'),
  ],
};

/**
 * Loop workflow with iteration
 */
export const loopWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    mockLoopNode('loop1', 5),
    mockTaskNode('process-item', 'agent-1', { name: 'Process Item' }),
    mockEndNode,
  ],
  edges: [
    mockEdge('start', 'loop1'),
    mockEdge('loop1', 'process-item'),
    mockEdge('process-item', 'loop1'),
    mockEdge('process-item', 'end'),
  ],
};

/**
 * Delay workflow with timing
 */
export const delayWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    mockTaskNode('task1', 'agent-1'),
    mockDelayNode('delay1', 1000),
    mockTaskNode('task2', 'agent-2'),
    mockEndNode,
  ],
  edges: [
    mockEdge('start', 'task1'),
    mockEdge('task1', 'delay1'),
    mockEdge('delay1', 'task2'),
    mockEdge('task2', 'end'),
  ],
};

/**
 * Complex workflow combining multiple patterns
 */
export const complexWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    mockParallelNode('fetch-parallel'),
    mockTaskNode('fetch-data-a', 'agent-1', { name: 'Fetch Data A' }),
    mockTaskNode('fetch-data-b', 'agent-2', { name: 'Fetch Data B' }),
    mockConditionNode('needs-review', '$requiresReview'),
    mockTaskNode('review', 'agent-3', { name: 'Review' }),
    mockTaskNode('skip-review', 'agent-4', { name: 'Skip Review' }),
    mockLoopNode('validation-loop', 3),
    mockTaskNode('validate', 'agent-5', { name: 'Validate' }),
    mockDelayNode('cooldown', 500),
    mockEndNode,
  ],
  edges: [
    mockEdge('start', 'fetch-parallel'),
    mockEdge('fetch-parallel', 'fetch-data-a'),
    mockEdge('fetch-parallel', 'fetch-data-b'),
    mockEdge('fetch-data-a', 'needs-review'),
    mockEdge('fetch-data-b', 'needs-review'),
    mockEdge('needs-review', 'review', '$requiresReview === true'),
    mockEdge('needs-review', 'skip-review', '$requiresReview === false'),
    mockEdge('review', 'validation-loop'),
    mockEdge('skip-review', 'validation-loop'),
    mockEdge('validation-loop', 'validate'),
    mockEdge('validate', 'validation-loop'),
    mockEdge('validate', 'cooldown'),
    mockEdge('cooldown', 'end'),
  ],
};

/**
 * Data processing workflow
 */
export const dataProcessingWorkflow: WorkflowDefinitionDto = {
  nodes: [
    { id: 'start', type: 'start' },
    { id: 'fetch', type: 'task', agentId: 'agent-fetch', config: { source: 'api' } },
    { id: 'transform', type: 'task', agentId: 'agent-transform', config: { format: 'json' } },
    { id: 'validate', type: 'condition', condition: '$dataValid' },
    { id: 'store', type: 'task', agentId: 'agent-store', config: { destination: 'database' } },
    { id: 'retry', type: 'task', agentId: 'agent-retry', config: { maxRetries: 3 } },
    { id: 'end', type: 'end' },
  ],
  edges: [
    { from: 'start', to: 'fetch' },
    { from: 'fetch', to: 'transform' },
    { from: 'transform', to: 'validate' },
    { from: 'validate', to: 'store', condition: true },
    { from: 'validate', to: 'retry', condition: false },
    { from: 'store', to: 'end' },
    { from: 'retry', to: 'end' },
  ],
};

/**
 * Content creation workflow
 */
export const contentCreationWorkflow: WorkflowDefinitionDto = {
  nodes: [
    { id: 'start', type: 'start' },
    { id: 'research', type: 'task', agentId: 'agent-research', config: { depth: 'deep' } },
    { id: 'draft', type: 'task', agentId: 'agent-draft', config: { style: 'professional' } },
    { id: 'parallel-review', type: 'parallel' },
    { id: 'grammar-check', type: 'task', agentId: 'agent-grammar' },
    { id: 'fact-check', type: 'task', agentId: 'agent-facts' },
    { id: 'plagiarism-check', type: 'task', agentId: 'agent-plagiarism' },
    { id: 'revise', type: 'task', agentId: 'agent-revise' },
    { id: 'end', type: 'end' },
  ],
  edges: [
    { from: 'start', to: 'research' },
    { from: 'research', to: 'draft' },
    { from: 'draft', to: 'parallel-review' },
    { from: 'parallel-review', to: 'grammar-check' },
    { from: 'parallel-review', to: 'fact-check' },
    { from: 'parallel-review', to: 'plagiarism-check' },
    { from: 'grammar-check', to: 'revise' },
    { from: 'fact-check', to: 'revise' },
    { from: 'plagiarism-check', to: 'revise' },
    { from: 'revise', to: 'end' },
  ],
};

/**
 * Code review workflow
 */
export const codeReviewWorkflow: WorkflowDefinitionDto = {
  nodes: [
    { id: 'start', type: 'start' },
    { id: 'analyze', type: 'task', agentId: 'agent-analyze', config: { languages: ['typescript', 'python'] } },
    { id: 'check-style', type: 'task', agentId: 'agent-style' },
    { id: 'check-security', type: 'task', agentId: 'agent-security' },
    { id: 'check-tests', type: 'task', agentId: 'agent-tests' },
    { id: 'condition-approval', type: 'condition', condition: '$approved' },
    { id: 'approve', type: 'task', agentId: 'agent-approve', config: { action: 'merge' } },
    { id: 'request-changes', type: 'task', agentId: 'agent-changes', config: { action: 'comment' } },
    { id: 'end', type: 'end' },
  ],
  edges: [
    { from: 'start', to: 'analyze' },
    { from: 'analyze', to: 'check-style' },
    { from: 'check-style', to: 'check-security' },
    { from: 'check-security', to: 'check-tests' },
    { from: 'check-tests', to: 'condition-approval' },
    { from: 'condition-approval', to: 'approve', condition: true },
    { from: 'condition-approval', to: 'request-changes', condition: false },
    { from: 'approve', to: 'end' },
    { from: 'request-changes', to: 'end' },
  ],
};

// ============================================
// Invalid Workflow Definitions (for error testing)
// ============================================

/**
 * Missing start node
 */
export const missingStartNodeWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockTaskNode('task1', 'agent-1'),
    mockEndNode,
  ],
  edges: [
    mockEdge('task1', 'end'),
  ],
};

/**
 * Missing end node
 */
export const missingEndNodeWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    mockTaskNode('task1', 'agent-1'),
  ],
  edges: [
    mockEdge('start', 'task1'),
  ],
};

/**
 * Multiple start nodes
 */
export const multipleStartNodesWorkflow: WorkflowDefinitionDto = {
  nodes: [
    { id: 'start1', type: 'start' },
    { id: 'start2', type: 'start' },
    mockEndNode,
  ],
  edges: [
    mockEdge('start1', 'end'),
    mockEdge('start2', 'end'),
  ],
};

/**
 * Task without agentId
 */
export const taskWithoutAgentIdWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    { id: 'task1', type: 'task' as any },
    mockEndNode,
  ],
  edges: [
    mockEdge('start', 'task1'),
    mockEdge('task1', 'end'),
  ],
};

/**
 * Condition without expression
 */
export const conditionWithoutExpressionWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    { id: 'condition1', type: 'condition' as any },
    mockEndNode,
  ],
  edges: [
    mockEdge('start', 'condition1'),
    mockEdge('condition1', 'end'),
  ],
};

/**
 * Delay without value
 */
export const delayWithoutValueWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    { id: 'delay1', type: 'delay' as any },
    mockEndNode,
  ],
  edges: [
    mockEdge('start', 'delay1'),
    mockEdge('delay1', 'end'),
  ],
};

/**
 * Loop without maxIterations
 */
export const loopWithoutMaxIterationsWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    { id: 'loop1', type: 'loop' as any },
    mockEndNode,
  ],
  edges: [
    mockEdge('start', 'loop1'),
    mockEdge('loop1', 'end'),
  ],
};

/**
 * Edge with non-existent source
 */
export const edgeWithInvalidSourceWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    mockEndNode,
  ],
  edges: [
    mockEdge('nonexistent', 'end'),
  ],
};

/**
 * Edge with non-existent target
 */
export const edgeWithInvalidTargetWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    mockEndNode,
  ],
  edges: [
    mockEdge('start', 'nonexistent'),
  ],
};

/**
 * Duplicate node IDs
 */
export const duplicateNodeIdsWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    { id: 'start', type: 'end' }, // Duplicate ID
  ],
  edges: [],
};

/**
 * Unreachable node
 */
export const unreachableNodeWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    mockTaskNode('task1', 'agent-1'),
    mockTaskNode('orphan', 'agent-2'),
    mockEndNode,
  ],
  edges: [
    mockEdge('start', 'task1'),
    mockEdge('task1', 'end'),
    // orphan is not connected
  ],
};

/**
 * Invalid cycle
 */
export const invalidCycleWorkflow: WorkflowDefinitionDto = {
  nodes: [
    mockStartNode,
    mockTaskNode('task1', 'agent-1'),
    mockTaskNode('task2', 'agent-2'),
    mockEndNode,
  ],
  edges: [
    mockEdge('start', 'task1'),
    mockEdge('task1', 'task2'),
    mockEdge('task2', 'task1'), // Creates invalid cycle
    mockEdge('task2', 'end'),
  ],
};

// ============================================
// Test Context Data
// ============================================
export const mockContextData = {
  empty: {},

  simple: {
    userId: 'user-123',
    timestamp: '2024-01-01T00:00:00Z',
  },

  withScore: {
    score: 85,
    passed: true,
  },

  withItems: {
    items: [1, 2, 3, 4, 5],
    total: 5,
  },

  nested: {
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    },
    settings: {
      notifications: true,
      theme: 'dark',
    },
  },
};

// ============================================
// Template Mock Data
// ============================================
export const mockTemplateData = {
  simple: {
    id: 'template-simple',
    name: 'Simple Workflow',
    description: 'A simple linear workflow',
    category: 'basic',
    version: '1.0.0',
    definition: JSON.stringify(simpleLinearWorkflow),
    tags: ['basic', 'linear'],
    author: 'test',
    isActive: true,
    usageCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  parallel: {
    id: 'template-parallel',
    name: 'Parallel Workflow',
    description: 'A workflow with parallel execution',
    category: 'advanced',
    version: '1.0.0',
    definition: JSON.stringify(parallelWorkflow),
    tags: ['advanced', 'parallel'],
    author: 'test',
    isActive: true,
    usageCount: 10,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },

  conditional: {
    id: 'template-conditional',
    name: 'Conditional Workflow',
    description: 'A workflow with conditional branching',
    category: 'advanced',
    version: '1.0.0',
    definition: JSON.stringify(conditionalWorkflow),
    tags: ['advanced', 'condition'],
    author: 'test',
    isActive: true,
    usageCount: 5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
};

// ============================================
// Instance Mock Data
// ============================================
export const mockInstanceData = {
  pending: {
    id: 'instance-pending',
    templateId: 'template-simple',
    taskId: null,
    status: 'pending',
    context: '{}',
    currentNode: 'start',
    startedAt: null,
    completedAt: null,
    errorMessage: null,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  },

  running: {
    id: 'instance-running',
    templateId: 'template-simple',
    taskId: 'task-123',
    status: 'running',
    context: JSON.stringify({ step: 1 }),
    currentNode: 'task1',
    startedAt: new Date('2024-01-01T10:00:00Z'),
    completedAt: null,
    errorMessage: null,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:01Z'),
  },

  paused: {
    id: 'instance-paused',
    templateId: 'template-simple',
    taskId: null,
    status: 'paused',
    context: JSON.stringify({ step: 2 }),
    currentNode: 'task1',
    startedAt: new Date('2024-01-01T10:00:00Z'),
    completedAt: null,
    errorMessage: null,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:02Z'),
  },

  completed: {
    id: 'instance-completed',
    templateId: 'template-simple',
    taskId: 'task-456',
    status: 'completed',
    context: JSON.stringify({ result: 'success' }),
    currentNode: 'end',
    startedAt: new Date('2024-01-01T10:00:00Z'),
    completedAt: new Date('2024-01-01T10:00:05Z'),
    errorMessage: null,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:05Z'),
  },

  failed: {
    id: 'instance-failed',
    templateId: 'template-simple',
    taskId: null,
    status: 'failed',
    context: '{}',
    currentNode: 'task1',
    startedAt: new Date('2024-01-01T10:00:00Z'),
    completedAt: new Date('2024-01-01T10:00:03Z'),
    errorMessage: 'Task execution failed',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:03Z'),
  },

  cancelled: {
    id: 'instance-cancelled',
    templateId: 'template-simple',
    taskId: null,
    status: 'cancelled',
    context: '{}',
    currentNode: 'task1',
    startedAt: new Date('2024-01-01T10:00:00Z'),
    completedAt: new Date('2024-01-01T10:00:02Z'),
    errorMessage: null,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:02Z'),
  },
};

// ============================================
// Node Execution Mock Data
// ============================================
export const mockNodeExecutionData = {
  start: {
    id: 'exec-start',
    instanceId: 'instance-1',
    nodeId: 'start',
    nodeType: 'start',
    status: 'completed',
    input: '{}',
    output: JSON.stringify({ started: true }),
    error: null,
    startedAt: new Date('2024-01-01T10:00:00Z'),
    completedAt: new Date('2024-01-01T10:00:00.100Z'),
    duration: 100,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00.100Z'),
  },

  task: {
    id: 'exec-task',
    instanceId: 'instance-1',
    nodeId: 'task1',
    nodeType: 'task',
    status: 'completed',
    input: '{}',
    output: JSON.stringify({ result: 'success' }),
    error: null,
    startedAt: new Date('2024-01-01T10:00:00.100Z'),
    completedAt: new Date('2024-01-01T10:00:00.300Z'),
    duration: 200,
    createdAt: new Date('2024-01-01T10:00:00.100Z'),
    updatedAt: new Date('2024-01-01T10:00:00.300Z'),
  },

  failed: {
    id: 'exec-failed',
    instanceId: 'instance-1',
    nodeId: 'task1',
    nodeType: 'task',
    status: 'failed',
    input: '{}',
    output: null,
    error: 'Connection timeout',
    startedAt: new Date('2024-01-01T10:00:00Z'),
    completedAt: new Date('2024-01-01T10:00:05Z'),
    duration: 5000,
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:05Z'),
  },
};
