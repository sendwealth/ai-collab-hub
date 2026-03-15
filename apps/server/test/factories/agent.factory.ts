import { PrismaService } from '../../src/modules/common/prisma/prisma.service';
import * as crypto from 'crypto';

export interface CreateAgentData {
  name?: string;
  publicKey?: string;
  description?: string;
  capabilities?: any;
  endpoint?: any;
  metadata?: any;
  status?: 'idle' | 'busy' | 'offline';
  trustScore?: number;
}

export class AgentFactory {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a single agent with default values
   */
  async create(data: CreateAgentData = {}) {
    const agentData = {
      name: data.name || `TestAgent_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      publicKey: data.publicKey || `pk_test_${crypto.randomBytes(16).toString('hex')}`,
      description: data.description || 'Test agent created by factory',
      capabilities: data.capabilities
        ? JSON.stringify(data.capabilities)
        : JSON.stringify({
            skills: ['testing', 'code-review'],
            tools: ['jest', 'supertest'],
            protocols: ['http'],
            maxConcurrentTasks: 5,
            estimatedResponseTime: 2000,
          }),
      endpoint: data.endpoint
        ? JSON.stringify(data.endpoint)
        : JSON.stringify({
            http: 'https://api.testagent.com',
            websocket: 'wss://ws.testagent.com',
          }),
      metadata: data.metadata
        ? JSON.stringify(data.metadata)
        : JSON.stringify({
            version: '1.0.0',
            environment: 'testing',
          }),
      apiKey: `sk_agent_${crypto.randomBytes(32).toString('hex')}`,
      status: data.status || 'idle',
      trustScore: data.trustScore ?? Math.floor(Math.random() * 100),
    };

    return this.prisma.agent.create({
      data: agentData,
    });
  }

  /**
   * Create multiple agents
   */
  async createMany(countOrDataList: number | CreateAgentData[]) {
    if (typeof countOrDataList === 'number') {
      const agents = [];
      for (let i = 0; i < countOrDataList; i++) {
        agents.push(await this.create());
      }
      return agents;
    } else {
      const agents = [];
      for (const data of countOrDataList) {
        agents.push(await this.create(data));
      }
      return agents;
    }
  }

  /**
   * Create an agent with specific capabilities
   */
  async createWithSkills(skills: string[], additionalData: CreateAgentData = {}) {
    return this.create({
      ...additionalData,
      capabilities: {
        skills,
        tools: [],
        protocols: ['http'],
        maxConcurrentTasks: 5,
      },
    });
  }

  /**
   * Create an idle agent
   */
  async createIdle(data: CreateAgentData = {}) {
    return this.create({ ...data, status: 'idle' });
  }

  /**
   * Create a busy agent
   */
  async createBusy(data: CreateAgentData = {}) {
    return this.create({ ...data, status: 'busy' });
  }

  /**
   * Create an offline agent
   */
  async createOffline(data: CreateAgentData = {}) {
    return this.create({ ...data, status: 'offline' });
  }

  /**
   * Create an agent with high trust score
   */
  async createTrusted(data: CreateAgentData = {}) {
    return this.create({ ...data, trustScore: 90 });
  }

  /**
   * Create an agent with low trust score
   */
  async createUntrusted(data: CreateAgentData = {}) {
    return this.create({ ...data, trustScore: 10 });
  }

  /**
   * Create a fully configured agent for E2E tests
   */
  async createForE2E(data: CreateAgentData = {}) {
    const agent = await this.create({
      name: data.name || `E2EAgent_${Date.now()}`,
      description: data.description || 'E2E test agent',
      capabilities: data.capabilities || {
        skills: ['e2e-testing', 'integration-testing'],
        tools: ['supertest', 'jest'],
        protocols: ['http', 'websocket'],
        maxConcurrentTasks: 10,
        estimatedResponseTime: 1500,
      },
      endpoint: data.endpoint || {
        http: 'https://e2e.testagent.com',
        websocket: 'wss://e2e.ws.testagent.com',
      },
      metadata: data.metadata || {
        version: '1.0.0',
        author: 'E2E Test Suite',
        environment: 'testing',
      },
      status: data.status || 'idle',
      trustScore: data.trustScore ?? 75,
      ...data,
    });

    return {
      ...agent,
      // Parse JSON fields for easier testing
      capabilities: agent.capabilities ? JSON.parse(agent.capabilities as any) : null,
      endpoint: agent.endpoint ? JSON.parse(agent.endpoint as any) : null,
      metadata: agent.metadata ? JSON.parse(agent.metadata as any) : null,
    };
  }

  /**
   * Clean up all test agents
   */
  async cleanup(pattern?: string) {
    const where = pattern
      ? { name: { contains: pattern } }
      : { name: { contains: 'Test' } };

    return this.prisma.agent.deleteMany({ where });
  }
}
