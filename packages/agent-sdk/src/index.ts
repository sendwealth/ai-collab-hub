import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'eventemitter3';
import { io, Socket } from 'socket.io-client';

// ============================================
// 类型定义
// ============================================

export interface AgentCapabilities {
  skills?: string[];
  tools?: string[];
  protocols?: string[];
  maxConcurrentTasks?: number;
  estimatedResponseTime?: number;
}

export interface AgentEndpoint {
  http?: string;
  websocket?: string;
}

export interface AgentConfig {
  platformUrl: string;
  apiKey: string;
  agentId?: string;
}

export interface RegisterOptions {
  name: string;
  publicKey: string;
  description?: string;
  capabilities?: AgentCapabilities;
  endpoint?: AgentEndpoint;
  metadata?: Record<string, any>;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: string;
  category?: string;
  requirements: Record<string, any>;
  reward: Record<string, any>;
  status: string;
  result?: Record<string, any>;
  createdById: string;
  assigneeId?: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Bid {
  id: string;
  taskId: string;
  agentId: string;
  proposal: string;
  estimatedTime?: number;
  estimatedCost?: number;
  status: string;
  createdAt: string;
}

export interface BidOptions {
  proposal: string;
  estimatedTime?: number;
  estimatedCost?: number;
}

export interface SubmitOptions {
  result: Record<string, any>;
}

// ============================================
// Agent Client
// ============================================

export class AgentClient extends EventEmitter {
  private client: AxiosInstance;
  private socket: Socket | null = null;
  private config: AgentConfig;
  private agentId: string | null = null;

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.client = axios.create({
      baseURL: config.platformUrl,
      headers: {
        'X-API-Key': config.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 注册Agent
   */
  async register(options: RegisterOptions): Promise<{ agentId: string; apiKey: string }> {
    const response = await this.client.post('/api/v1/agents/register', options);
    this.agentId = response.data.agentId;
    
    // 更新API Key
    if (response.data.apiKey) {
      this.config.apiKey = response.data.apiKey;
      this.client.defaults.headers['X-API-Key'] = response.data.apiKey;
    }

    return response.data;
  }

  /**
   * 获取自己的信息
   */
  async getMe(): Promise<any> {
    const response = await this.client.get('/api/v1/agents/me');
    this.agentId = response.data.id;
    return response.data;
  }

  /**
   * 更新状态
   */
  async updateStatus(status: 'idle' | 'busy' | 'offline'): Promise<void> {
    await this.client.put('/api/v1/agents/me/status', { status });
    this.emit('status:updated', status);
  }

  /**
   * 发现Agent
   */
  async discoverAgents(filters?: { skill?: string; status?: string; limit?: number }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.skill) params.append('skill', filters.skill);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await this.client.get(`/api/v1/agents?${params.toString()}`);
    return response.data;
  }

  /**
   * 浏览任务
   */
  async getTasks(filters?: { status?: string; category?: string; limit?: number }): Promise<{ total: number; tasks: Task[] }> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await this.client.get(`/api/v1/tasks?${params.toString()}`);
    return response.data;
  }

  /**
   * 获取任务详情
   */
  async getTask(taskId: string): Promise<Task> {
    const response = await this.client.get(`/api/v1/tasks/${taskId}`);
    return response.data;
  }

  /**
   * 竞标任务
   */
  async bidTask(taskId: string, options: BidOptions): Promise<Bid> {
    const response = await this.client.post(`/api/v1/tasks/${taskId}/bid`, options);
    this.emit('task:bid', { taskId, bid: response.data });
    return response.data;
  }

  /**
   * 提交任务结果
   */
  async submitTask(taskId: string, options: SubmitOptions): Promise<Task> {
    const response = await this.client.post(`/api/v1/tasks/${taskId}/submit`, options);
    this.emit('task:submitted', { taskId, task: response.data });
    return response.data;
  }

  /**
   * 完成任务（任务创建者）
   */
  async completeTask(taskId: string, rating?: number): Promise<Task> {
    const response = await this.client.post(`/api/v1/tasks/${taskId}/complete`, { rating });
    this.emit('task:completed', { taskId, task: response.data });
    return response.data;
  }

  /**
   * 获取我的任务
   */
  async getMyTasks(status?: string): Promise<{ total: number; tasks: Task[] }> {
    const params = status ? `?status=${status}` : '';
    const response = await this.client.get(`/api/v1/tasks/me${params}`);
    return response.data;
  }

  /**
   * 创建任务
   */
  async createTask(task: {
    title: string;
    description?: string;
    type?: string;
    category?: string;
    requirements?: Record<string, any>;
    reward?: Record<string, any>;
    deadline?: string;
  }): Promise<{ taskId: string; task: Task }> {
    const response = await this.client.post('/api/v1/tasks', task);
    this.emit('task:created', response.data);
    return response.data;
  }

  /**
   * 连接WebSocket（实时通知）
   */
  connectWebSocket(): void {
    if (this.socket) {
      return;
    }

    this.socket = io(this.config.platformUrl, {
      auth: {
        apiKey: this.config.apiKey,
      },
    });

    this.socket.on('connect', () => {
      this.emit('ws:connected');
    });

    this.socket.on('disconnect', () => {
      this.emit('ws:disconnected');
    });

    this.socket.on('task:available', (task: Task) => {
      this.emit('task:available', task);
    });

    this.socket.on('task:assigned', (task: Task) => {
      this.emit('task:assigned', task);
    });

    this.socket.on('task:completed', (task: Task) => {
      this.emit('task:completed', task);
    });

    this.socket.on('error', (error: any) => {
      this.emit('ws:error', error);
    });
  }

  /**
   * 断开WebSocket
   */
  disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * 获取Agent ID
   */
  getAgentId(): string | null {
    return this.agentId;
  }
}

// ============================================
// 导出
// ============================================

export default AgentClient;
