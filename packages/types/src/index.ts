// ============================================
// 用户类型
// ============================================

export type UserType = 'HUMAN' | 'AGENT';
export type UserStatus = 'ONLINE' | 'BUSY' | 'OFFLINE';

export interface User {
  id: string;
  username: string;
  email: string;
  type: UserType;
  avatar?: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  type?: UserType;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ============================================
// Agent类型
// ============================================

export interface AgentCapabilities {
  skills: string[];
  tools: string[];
  protocols: string[];
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  description?: string;
  capabilities: AgentCapabilities;
  endpoint?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAgentDto {
  name: string;
  description?: string;
  capabilities: AgentCapabilities;
  endpoint?: string;
}

// ============================================
// 频道和消息类型
// ============================================

export type ChannelType = 'DM' | 'GROUP' | 'TASK';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  description?: string;
  createdById?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelMember {
  channelId: string;
  userId: string;
  role: MemberRole;
  joinedAt: Date;
}

export type MessageType = 'TEXT' | 'FILE' | 'IMAGE' | 'SYSTEM' | 'TASK';

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  parentId?: string;
  content: string;
  type: MessageType;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface SendMessageDto {
  channelId: string;
  content: string;
  type?: MessageType;
  parentId?: string;
  metadata?: Record<string, any>;
}

export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

// ============================================
// 任务类型
// ============================================

export type TaskStatus = 'PENDING' | 'ASSIGNED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type DependencyType = 'HARD' | 'SOFT';

export interface Task {
  id: string;
  title: string;
  description?: string;
  channelId?: string;
  creatorId: string;
  assigneeId?: string;
  status: TaskStatus;
  priority: TaskPriority;
  result?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  channelId?: string;
  assigneeId?: string;
  priority?: TaskPriority;
  dependencies?: string[];
}

export interface TaskDependency {
  id: string;
  taskId: string;
  dependsOnId: string;
  type: DependencyType;
  createdAt: Date;
}

// ============================================
// 记忆类型
// ============================================

export type MemoryType = 'SHORT' | 'LONG' | 'SHARED';

export interface Memory {
  id: string;
  agentId: string;
  type: MemoryType;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

export interface StoreMemoryDto {
  agentId: string;
  type: MemoryType;
  content: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
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
// WebSocket事件类型
// ============================================

export interface WebSocketEvents {
  // 客户端 -> 服务器
  'message:send': SendMessageDto;
  'message:typing': { channelId: string };
  'channel:join': { channelId: string };
  'channel:leave': { channelId: string };

  // 服务器 -> 客户端
  'message:new': Message;
  'message:update': Message;
  'message:delete': { id: string };
  'user:status': { userId: string; status: UserStatus };
  'typing:start': { channelId: string; userId: string };
  'typing:stop': { channelId: string; userId: string };
  'task:update': Task;
}

// ============================================
// Agent协议类型
// ============================================

// MCP (Model Context Protocol)
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

// A2A (Agent-to-Agent)
export interface A2AMessage {
  id: string;
  from: string;
  to: string;
  type: 'request' | 'response' | 'notification';
  action: string;
  payload: any;
  timestamp: number;
  ttl?: number;
}

export interface AgentCard {
  id: string;
  name: string;
  capabilities: AgentCapabilities;
  endpoint: string;
  status: UserStatus;
}

// ACP (Agent Communication Protocol)
export interface ACPWorkflow {
  id: string;
  name: string;
  steps: ACPStep[];
  variables: Record<string, any>;
  timeout: number;
  retryPolicy: {
    maxRetries: number;
    backoff: 'fixed' | 'exponential';
  };
}

export interface ACPStep {
  id: string;
  type: 'task' | 'condition' | 'parallel' | 'loop';
  agent?: string;
  action: string;
  input: any;
  output?: string;
  next?: string | string[];
  condition?: {
    if: string;
    then: string;
    else: string;
  };
}
