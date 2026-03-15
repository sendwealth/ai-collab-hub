import * as crypto from 'crypto';

export class MockDataGenerator {
  /**
   * Generate a random agent name
   */
  static generateAgentName(prefix = 'TestAgent'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Generate a random public key
   */
  static generatePublicKey(): string {
    return `pk_test_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate a random API key
   */
  static generateApiKey(): string {
    return `sk_agent_${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Generate random capabilities
   */
  static generateCapabilities() {
    const skills = [
      'code-review',
      'testing',
      'refactoring',
      'documentation',
      'deployment',
      'monitoring',
      'security-audit',
      'performance-optimization',
    ];
    const tools = ['jest', 'mocha', 'supertest', 'prettier', 'eslint', 'webpack', 'docker'];
    const protocols = ['http', 'https', 'websocket', 'grpc', 'graphql'];

    const numSkills = Math.floor(Math.random() * 3) + 1;
    const numTools = Math.floor(Math.random() * 4) + 1;

    return {
      skills: this.shuffleArray(skills).slice(0, numSkills),
      tools: this.shuffleArray(tools).slice(0, numTools),
      protocols: this.shuffleArray(protocols).slice(0, Math.floor(Math.random() * 2) + 1),
      maxConcurrentTasks: Math.floor(Math.random() * 10) + 1,
      estimatedResponseTime: Math.floor(Math.random() * 3000) + 500,
    };
  }

  /**
   * Generate random endpoint configuration
   */
  static generateEndpoint() {
    const hasHttp = Math.random() > 0.3;
    const hasWebsocket = Math.random() > 0.5;
    const port = Math.floor(Math.random() * 10000) + 3000;
    const domain = `agent${Math.floor(Math.random() * 1000)}.example.com`;

    const endpoint: any = {};

    if (hasHttp) {
      endpoint.http = `https://${domain}`;
    }

    if (hasWebsocket) {
      endpoint.websocket = `wss://${domain}`;
    }

    return endpoint;
  }

  /**
   * Generate random metadata
   */
  static generateMetadata() {
    return {
      version: `${Math.floor(Math.random() * 3)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`,
      author: `Team ${Math.floor(Math.random() * 10)}`,
      environment: ['development', 'staging', 'production'][Math.floor(Math.random() * 3)],
      region: ['us-east-1', 'eu-west-1', 'ap-southeast-1'][Math.floor(Math.random() * 3)],
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Generate a complete mock agent object
   */
  static generateMockAgent(overrides: Partial<any> = {}) {
    const name = overrides.name || this.generateAgentName();
    const now = new Date();

    return {
      id: overrides.id || crypto.randomUUID(),
      name,
      publicKey: overrides.publicKey || this.generatePublicKey(),
      apiKey: overrides.apiKey || this.generateApiKey(),
      description: overrides.description || `Mock agent: ${name}`,
      capabilities: overrides.capabilities || JSON.stringify(this.generateCapabilities()),
      endpoint: overrides.endpoint || JSON.stringify(this.generateEndpoint()),
      metadata: overrides.metadata || JSON.stringify(this.generateMetadata()),
      status: overrides.status || 'idle',
      trustScore: overrides.trustScore ?? Math.floor(Math.random() * 100),
      lastSeen: overrides.lastSeen || now,
      createdAt: overrides.createdAt || now,
      updatedAt: overrides.updatedAt || now,
    };
  }

  /**
   * Generate multiple mock agents
   */
  static generateMockAgents(count: number, overrides: Partial<any> = {}) {
    return Array(count)
      .fill(null)
      .map(() => this.generateMockAgent(overrides));
  }

  /**
   * Generate a mock CreateAgentDto
   */
  static generateCreateAgentDto(overrides: Partial<any> = {}) {
    return {
      name: overrides.name || this.generateAgentName(),
      publicKey: overrides.publicKey || this.generatePublicKey(),
      description: overrides.description || 'Test agent description',
      capabilities: overrides.capabilities || this.generateCapabilities(),
      endpoint: overrides.endpoint || this.generateEndpoint(),
      metadata: overrides.metadata || this.generateMetadata(),
    };
  }

  /**
   * Generate a mock UpdateAgentDto
   */
  static generateUpdateAgentDto(overrides: Partial<any> = {}) {
    const updateFields = Math.floor(Math.random() * 4) + 1;
    const dto: any = {};

    if (updateFields >= 1) {
      dto.description = overrides.description || 'Updated description';
    }
    if (updateFields >= 2) {
      dto.capabilities = overrides.capabilities || this.generateCapabilities();
    }
    if (updateFields >= 3) {
      dto.endpoint = overrides.endpoint || this.generateEndpoint();
    }
    if (updateFields >= 4) {
      dto.metadata = overrides.metadata || this.generateMetadata();
    }

    return { ...dto, ...overrides };
  }

  /**
   * Generate a mock UpdateAgentStatusDto
   */
  static generateUpdateAgentStatusDto(status?: 'idle' | 'busy' | 'offline') {
    return {
      status: status || (['idle', 'busy', 'offline'] as const)[Math.floor(Math.random() * 3)],
    };
  }

  /**
   * Generate a mock agent response
   */
  static generateAgentResponse(overrides: Partial<any> = {}) {
    const agent = this.generateMockAgent(overrides);
    return {
      agentId: agent.id,
      apiKey: agent.apiKey,
      message: 'Agent registered successfully',
    };
  }

  /**
   * Generate mock discover response
   */
  static generateDiscoverResponse(agentCount: number = 5) {
    const agents = this.generateMockAgents(agentCount);
    return {
      total: agents.length,
      agents: agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        capabilities: agent.capabilities,
        status: agent.status,
        trustScore: agent.trustScore,
        lastSeen: agent.lastSeen,
      })),
    };
  }

  /**
   * Helper to shuffle array
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

/**
 * Pre-defined test scenarios
 */
export class TestScenarios {
  /**
   * Create a code review agent scenario
   */
  static codeReviewAgent() {
    return MockDataGenerator.generateCreateAgentDto({
      name: 'CodeReviewAgent',
      description: 'AI-powered code review assistant',
      capabilities: {
        skills: ['code-review', 'security-audit', 'performance-analysis'],
        tools: ['eslint', 'prettier', 'sonarqube'],
        protocols: ['http', 'git'],
        maxConcurrentTasks: 5,
        estimatedResponseTime: 3000,
      },
    });
  }

  /**
   * Create a testing agent scenario
   */
  static testingAgent() {
    return MockDataGenerator.generateCreateAgentDto({
      name: 'TestingAgent',
      description: 'Automated testing specialist',
      capabilities: {
        skills: ['unit-testing', 'integration-testing', 'e2e-testing'],
        tools: ['jest', 'mocha', 'cypress', 'playwright'],
        protocols: ['http'],
        maxConcurrentTasks: 10,
        estimatedResponseTime: 5000,
      },
    });
  }

  /**
   * Create a deployment agent scenario
   */
  static deploymentAgent() {
    return MockDataGenerator.generateCreateAgentDto({
      name: 'DeploymentAgent',
      description: 'CI/CD and deployment automation',
      capabilities: {
        skills: ['deployment', 'monitoring', 'scaling'],
        tools: ['docker', 'kubernetes', 'terraform'],
        protocols: ['http', 'ssh'],
        maxConcurrentTasks: 3,
        estimatedResponseTime: 10000,
      },
    });
  }

  /**
   * Create a minimal agent scenario
   */
  static minimalAgent() {
    return {
      name: MockDataGenerator.generateAgentName('MinimalAgent'),
      publicKey: MockDataGenerator.generatePublicKey(),
    };
  }

  /**
   * Create an invalid agent scenario (missing required fields)
   */
  static invalidAgent() {
    return {
      description: 'This agent has no name or publicKey',
    };
  }

  /**
   * Create an agent with duplicate name scenario
   */
  static duplicateNameAgent(existingName: string) {
    return MockDataGenerator.generateCreateAgentDto({
      name: existingName,
      publicKey: MockDataGenerator.generatePublicKey(),
    });
  }
}
