// ============================================
// Agent类型
// ============================================

export type TrustLevel = 'NEWCOMER' | 'RELIABLE' | 'EXCELLENT' | 'EXPERT';
export type AgentStatus = 'IDLE' | 'BUSY' | 'OFFLINE';

export interface AgentCapabilities {
  skills: string[];
  tools: string[];
  protocols: string[];
  maxConcurrentTasks?: number;
  estimatedResponseTime?: number;
}

export interface Agent {
  id: string;
  did?: string;
  name: string;
  description?: string;
  publicKey: string;
  apiKey: string;
  capabilities: AgentCapabilities;
  skills: string[];
  tools: string[];
  protocols: string[];
  httpEndpoint?: string;
  wsEndpoint?: string;
  trustScore: number;
  trustLevel: TrustLevel;
  totalTasks: number;
  completedTasks: number;
  status: AgentStatus;
  lastSeenAt?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterAgentDto {
  name: string;
  description?: string;
  publicKey: string;
  did?: string;
  capabilities: AgentCapabilities;
  httpEndpoint?: string;
  wsEndpoint?: string;
  metadata?: Record<string, any>;
}

export interface UpdateAgentStatusDto {
  status: AgentStatus;
}

// ============================================
// 信任与声誉
// ============================================

export interface Reputation {
  id: string;
  agentId: string;
  completionRate: number;
  qualityScore: number;
  speedScore: number;
  collabScore: number;
  totalReviews: number;
  averageRating: number;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// 任务类型
// ============================================

export type TaskType = 'INDEPENDENT' | 'COLLABORATIVE' | 'WORKFLOW';
export type TaskStatus = 'OPEN' | 'BIDDING' | 'ASSIGNED' | 'RUNNING' | 'REVIEWING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type CreatorType = 'AGENT' | 'HUMAN';

export interface TaskRequirements {
  skills?: string[];
  minExperience?: number;
  languages?: string[];
  tools?: string[];
  [key: string]: any;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  category?: string;
  requirements: TaskRequirements;
  requiredSkills: string[];
  minTrustScore: number;
  maxAgents: number;
  creditReward: number;
  reputationBonus: number;
  status: TaskStatus;
  creatorId: string;
  creatorType: CreatorType;
  assignedTo: string[];
  result?: Record<string, any>;
  submittedAt?: Date;
  completedAt?: Date;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  type?: TaskType;
  category?: string;
  requirements?: TaskRequirements;
  requiredSkills?: string[];
  minTrustScore?: number;
  maxAgents?: number;
  creditReward: number;
  reputationBonus?: number;
  deadline?: Date;
}

export interface SubmitTaskResultDto {
  result: Record<string, any>;
}

// ============================================
// 竞标
// ============================================

export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export interface Bid {
  id: string;
  taskId: string;
  agentId: string;
  proposal: string;
  estimatedTime: number;
  estimatedCost?: number;
  status: BidStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBidDto {
  proposal: string;
  estimatedTime: number;
  estimatedCost?: number;
}

// ============================================
// 协作
// ============================================

export type TeamStatus = 'FORMING' | 'ACTIVE' | 'COMPLETED' | 'DISBANDED';
export type TeamRole = 'LEADER' | 'WORKER' | 'REVIEWER' | 'SUPPORT';

export interface Team {
  id: string;
  name: string;
  taskId?: string;
  leaderId: string;
  status: TeamStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  agentId: string;
  role: TeamRole;
  joinedAt: Date;
}

export interface CreateTeamDto {
  name: string;
  taskId?: string;
  leaderId: string;
  memberIds?: string[];
}

// ============================================
// 工作流
// ============================================

export type WorkflowStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type WorkflowStepStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';

export interface WorkflowDefinition {
  name: string;
  description?: string;
  steps: WorkflowStepDefinition[];
  variables?: Record<string, any>;
  timeout?: number;
  retryPolicy?: {
    maxRetries: number;
    backoff: 'fixed' | 'exponential';
  };
}

export interface WorkflowStepDefinition {
  id: string;
  type: 'task' | 'condition' | 'parallel' | 'loop';
  name: string;
  agentSelector?: {
    strategy: 'any' | 'specific' | 'capability';
    requirements?: Record<string, any>;
    agentId?: string;
  };
  action: string;
  input?: any;
  output?: string;
  next?: string | string[];
  condition?: {
    if: string;
    then: string;
    else: string;
  };
  onFailure?: 'retry' | 'skip' | 'abort';
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  variables: Record<string, any>;
  status: WorkflowStatus;
  taskId?: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface WorkflowStep {
  id: string;
  workflowId: string;
  taskId?: string;
  stepId: string;
  name: string;
  status: WorkflowStepStatus;
  input?: Record<string, any>;
  output?: Record<string, any>;
  agentId?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  variables?: Record<string, any>;
}

// ============================================
// 通信
// ============================================

export type MessageType = 'REQUEST' | 'RESPONSE' | 'NOTIFICATION';

export interface A2AMessage {
  id: string;
  fromAgentId: string;
  toAgentId?: string;
  type: MessageType;
  action: string;
  payload: Record<string, any>;
  protocol: string;
  signature?: string;
  createdAt: Date;
}

export interface SendMessageDto {
  toAgentId?: string;
  type: MessageType;
  action: string;
  payload: Record<string, any>;
  protocol?: string;
}

// ============================================
// MCP协议
// ============================================

export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPExecuteRequest {
  agentId: string;
  tool: string;
  parameters: Record<string, any>;
}

export interface MCPResourceRequest {
  resourceUri: string;
  access: 'read' | 'write';
}

// ============================================
// API响应类型
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  traceId?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// WebSocket事件
// ============================================

export interface WebSocketEvents {
  // 客户端 -> 服务器
  'agent:status': UpdateAgentStatusDto;
  'task:search': { status?: TaskStatus; skills?: string[] };
  'task:bid': { taskId: string; bid: CreateBidDto };
  'message:send': SendMessageDto;

  // 服务器 -> 客户端
  'task:available': Task;
  'task:assigned': { taskId: string; agentId: string };
  'task:updated': Task;
  'message:received': A2AMessage;
  'workflow:step:started': { workflowId: string; stepId: string };
  'workflow:step:completed': { workflowId: string; stepId: string; output: any };
}

// ============================================
// Agent SDK类型
// ============================================

export interface AgentClientConfig {
  platformUrl: string;
  agentId: string;
  apiKey: string;
  privateKey?: string;
}

export interface TaskEvaluation {
  shouldBid: boolean;
  estimatedTime?: number;
  estimatedCost?: number;
  proposal?: string;
}
