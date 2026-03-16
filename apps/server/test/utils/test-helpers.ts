import { PrismaService } from '../../src/modules/common/prisma/prisma.service';
import {
  AgentTestQuestion,
  AgentTestAttempt,
  AgentCertification,
  AgentDeposit,
  Agent,
} from '@prisma/client';

/**
 * Database cleanup utilities
 */
export class DatabaseCleanup {
  constructor(private prisma: PrismaService) {}

  /**
   * Clean all test data for a specific agent
   */
  async cleanAgentData(agentId: string): Promise<void> {
    await this.prisma.agentDepositTransaction.deleteMany({
      where: { agentId },
    });
    await this.prisma.agentDeposit.deleteMany({
      where: { agentId },
    });
    await this.prisma.agentTestAnswer.deleteMany({
      where: {
        attempt: {
          agentId,
        },
      },
    });
    await this.prisma.agentTestAttempt.deleteMany({
      where: { agentId },
    });
    await this.prisma.agentCertification.deleteMany({
      where: { agentId },
    });
  }

  /**
   * Clean all test data
   */
  async cleanAllTestData(): Promise<void> {
    await this.prisma.agentDepositTransaction.deleteMany({});
    await this.prisma.agentDeposit.deleteMany({});
    await this.prisma.agentTestAnswer.deleteMany({});
    await this.prisma.agentTestAttempt.deleteMany({});
    await this.prisma.agentCertification.deleteMany({});
    await this.prisma.agentTestQuestion.deleteMany({});
  }

  /**
   * Clean database after each test
   */
  static async afterEach(prisma: PrismaService): Promise<void> {
    const cleanup = new DatabaseCleanup(prisma);
    await cleanup.cleanAllTestData();
  }
}

/**
 * Mock data generators
 */
export class TestDataGenerator {
  /**
   * Generate a mock agent
   */
  static generateAgent(overrides: Partial<Agent> = {}): Agent {
    return {
      id: `agent-${Math.random().toString(36).substr(2, 9)}`,
      name: `Test Agent ${Math.random().toString(36).substr(2, 5)}`,
      description: 'Test agent description',
      capabilities: ['coding'],
      version: '1.0.0',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Generate a mock test question
   */
  static generateTestQuestion(
    overrides: Partial<AgentTestQuestion> = {},
  ): AgentTestQuestion {
    return {
      id: `question-${Math.random().toString(36).substr(2, 9)}`,
      type: 'code_review',
      category: 'frontend',
      difficulty: 1,
      title: 'Test Question',
      description: 'Test description',
      codeSnippet: null,
      options: null,
      expectedAnswer: 'correct answer',
      explanation: 'Test explanation',
      points: 10,
      createdAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Generate a mock test attempt
   */
  static generateTestAttempt(
    overrides: Partial<AgentTestAttempt> = {},
  ): AgentTestAttempt {
    const questionIds = [
      `q-${Math.random().toString(36).substr(2, 9)}`,
      `q-${Math.random().toString(36).substr(2, 9)}`,
    ];

    return {
      id: `attempt-${Math.random().toString(36).substr(2, 9)}`,
      agentId: `agent-${Math.random().toString(36).substr(2, 9)}`,
      questionIds: JSON.stringify(questionIds),
      totalQuestions: questionIds.length,
      totalScore: 20,
      status: 'in_progress',
      score: null,
      percentage: null,
      level: null,
      startedAt: new Date(),
      completedAt: null,
      timeSpent: null,
      answers: [],
      ...overrides,
    };
  }

  /**
   * Generate a mock certification
   */
  static generateCertification(
    overrides: Partial<AgentCertification> = {},
  ): AgentCertification {
    return {
      id: `cert-${Math.random().toString(36).substr(2, 9)}`,
      agentId: `agent-${Math.random().toString(36).substr(2, 9)}`,
      level: 'bronze',
      score: 0,
      testScore: 0,
      tasksCompleted: 0,
      avgRating: 0,
      badgeUrl: null,
      earnedAt: null,
      expiresAt: null,
      totalTests: 0,
      bestScore: 0,
      ...overrides,
    };
  }

  /**
   * Generate a mock deposit
   */
  static generateDeposit(overrides: Partial<AgentDeposit> = {}): AgentDeposit {
    return {
      id: `deposit-${Math.random().toString(36).substr(2, 9)}`,
      agentId: `agent-${Math.random().toString(36).substr(2, 9)}`,
      balance: 0,
      frozenBalance: 0,
      totalDeposited: 0,
      totalDeducted: 0,
      totalRefunded: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  /**
   * Generate multiple test questions
   */
  static generateTestQuestions(
    count: number,
    overrides: Partial<AgentTestQuestion> = {},
  ): AgentTestQuestion[] {
    return Array(count)
      .fill(null)
      .map(() => this.generateTestQuestion(overrides));
  }
}

/**
 * Test agent creator
 */
export class TestAgentCreator {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a test agent in database
   */
  async createTestAgent(overrides: Partial<Agent> = {}): Promise<Agent> {
    const agentData = TestDataGenerator.generateAgent(overrides);
    return this.prisma.agent.create({
      data: agentData,
    });
  }

  /**
   * Create multiple test agents
   */
  async createTestAgents(
    count: number,
    overrides: Partial<Agent> = {},
  ): Promise<Agent[]> {
    const agents = Array(count)
      .fill(null)
      .map(() => TestDataGenerator.generateAgent(overrides));

    return Promise.all(
      agents.map((agent) =>
        this.prisma.agent.create({
          data: agent,
        }),
      ),
    );
  }

  /**
   * Create a test agent with certification
   */
  async createAgentWithCertification(
    agentOverrides: Partial<Agent> = {},
    certOverrides: Partial<AgentCertification> = {},
  ): Promise<{ agent: Agent; certification: AgentCertification }> {
    const agent = await this.createTestAgent(agentOverrides);
    const certificationData = TestDataGenerator.generateCertification({
      agentId: agent.id,
      ...certOverrides,
    });

    const certification = await this.prisma.agentCertification.create({
      data: certificationData,
    });

    return { agent, certification };
  }

  /**
   * Create a test agent with deposit
   */
  async createAgentWithDeposit(
    agentOverrides: Partial<Agent> = {},
    depositOverrides: Partial<AgentDeposit> = {},
  ): Promise<{ agent: Agent; deposit: AgentDeposit }> {
    const agent = await this.createTestAgent(agentOverrides);
    const depositData = TestDataGenerator.generateDeposit({
      agentId: agent.id,
      ...depositOverrides,
    });

    const deposit = await this.prisma.agentDeposit.create({
      data: depositData,
    });

    return { agent, deposit };
  }
}

/**
 * Assertion helpers
 */
export class TestAssertions {
  /**
   * Assert that API response has expected structure
   */
  static assertApiResponse(response: any, expectedFields: string[]): void {
    expectedFields.forEach((field) => {
      expect(response).toHaveProperty(field);
    });
  }

  /**
   * Assert that pagination result is valid
   */
  static assertPagination(
    result: any,
    expected: {
      page: number;
      limit: number;
      total: number;
      totalPages?: number;
    },
  ): void {
    expect(result.page).toBe(expected.page);
    expect(result.limit).toBe(expected.limit);
    expect(result.total).toBe(expected.total);
    if (expected.totalPages !== undefined) {
      expect(result.totalPages).toBe(expected.totalPages);
    }
  }

  /**
   * Assert that error response has correct format
   */
  static assertErrorResponse(
    error: any,
    expectedMessage?: string,
    expectedStatusCode?: number,
  ): void {
    expect(error).toBeDefined();
    if (expectedMessage) {
      expect(error.message).toContain(expectedMessage);
    }
    if (expectedStatusCode) {
      expect(error.status).toBe(expectedStatusCode);
    }
  }

  /**
   * Assert that score is within valid range
   */
  static assertScoreRange(score: number, min = 0, max = 100): void {
    expect(score).toBeGreaterThanOrEqual(min);
    expect(score).toBeLessThanOrEqual(max);
  }

  /**
   * Assert that certification level is valid
   */
  static assertCertificationLevel(level: string): void {
    expect(['bronze', 'silver', 'gold']).toContain(level.toLowerCase());
  }

  /**
   * Assert that monetary value is non-negative
   */
  static assertNonNegative(value: number): void {
    expect(value).toBeGreaterThanOrEqual(0);
  }

  /**
   * Assert that dates are in correct order
   */
  static assertDateOrder(before: Date, after: Date): void {
    expect(before.getTime()).toBeLessThanOrEqual(after.getTime());
  }

  /**
   * Assert that array has expected length
   */
  static assertArrayLength<T>(array: T[], expectedLength: number): void {
    expect(array).toHaveLength(expectedLength);
  }

  /**
   * Assert that object has all required fields
   */
  static assertHasFields(obj: any, fields: string[]): void {
    fields.forEach((field) => {
      expect(obj).toHaveProperty(field);
    });
  }

  /**
   * Assert that value is within percentage range
   */
  static assertPercentageRange(value: number, min = 0, max = 100): void {
    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  /**
   * Measure execution time of a function
   */
  static async measureTime<T>(
    fn: () => Promise<T>,
  ): Promise<{ result: T; timeMs: number }> {
    const start = Date.now();
    const result = await fn();
    const timeMs = Date.now() - start;
    return { result, timeMs };
  }

  /**
   * Assert that function executes within time limit
   */
  static async assertExecutionTime<T>(
    fn: () => Promise<T>,
    maxTimeMs: number,
  ): Promise<T> {
    const { result, timeMs } = await this.measureTime(fn);
    expect(timeMs).toBeLessThanOrEqual(maxTimeMs);
    return result;
  }

  /**
   * Run concurrent operations and measure performance
   */
  static async runConcurrentOperations<T>(
    count: number,
    fn: (index: number) => Promise<T>,
  ): Promise<{ results: T[]; totalTimeMs: number; avgTimeMs: number }> {
    const start = Date.now();
    const results = await Promise.all(
      Array(count)
        .fill(null)
        .map((_, i) => fn(i)),
    );
    const totalTimeMs = Date.now() - start;
    const avgTimeMs = totalTimeMs / count;

    return { results, totalTimeMs, avgTimeMs };
  }
}

/**
 * Security testing utilities
 */
export class SecurityTestUtils {
  /**
   * Generate XSS attack payloads
   */
  static getXSSPayloads(): string[] {
    return [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert("xss")>',
      '<svg onload=alert("xss")>',
      'javascript:alert("xss")',
      '<iframe src="javascript:alert(\'xss\')">',
    ];
  }

  /**
   * Generate SQL injection payloads
   */
  static getSQLInjectionPayloads(): string[] {
    return [
      "' OR '1'='1",
      "' UNION SELECT * FROM users--",
      "'; DROP TABLE agents;--",
      "' OR 1=1--",
      "admin'--",
    ];
  }

  /**
   * Generate path traversal payloads
   */
  static getPathTraversalPayloads(): string[] {
    return [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
    ];
  }

  /**
   * Test if input is sanitized properly
   */
  static assertSanitized(input: string, output: string): void {
    // Output should not contain dangerous patterns
    expect(output).not.toMatch(/<script>/i);
    expect(output).not.toMatch(/javascript:/i);
    expect(output).not.toMatch(/onerror=/i);
    expect(output).not.toMatch(/onload=/i);
  }
}

/**
 * Integration test helpers
 */
export class IntegrationTestHelpers {
  /**
   * Create complete test scenario with agent, certification, and deposit
   */
  static async createCompleteScenario(
    prisma: PrismaService,
    overrides: {
      agent?: Partial<Agent>;
      certification?: Partial<AgentCertification>;
      deposit?: Partial<AgentDeposit>;
    } = {},
  ): Promise<{
    agent: Agent;
    certification: AgentCertification;
    deposit: AgentDeposit;
  }> {
    const agentData = TestDataGenerator.generateAgent(overrides.agent);
    const agent = await prisma.agent.create({ data: agentData });

    const certificationData = TestDataGenerator.generateCertification({
      agentId: agent.id,
      ...overrides.certification,
    });
    const certification = await prisma.agentCertification.create({
      data: certificationData,
    });

    const depositData = TestDataGenerator.generateDeposit({
      agentId: agent.id,
      ...overrides.deposit,
    });
    const deposit = await prisma.agentDeposit.create({
      data: depositData,
    });

    return { agent, certification, deposit };
  }

  /**
   * Seed test questions for testing
   */
  static async seedTestQuestions(
    prisma: PrismaService,
    count: number = 10,
  ): Promise<AgentTestQuestion[]> {
    const questions = TestDataGenerator.generateTestQuestions(count);
    return prisma.agentTestQuestion.createMany({
      data: questions,
      skipDuplicates: true,
    });
  }

  /**
   * Wait for async operations to complete
   */
  static async waitFor(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 100,
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await this.waitFor(delayMs * Math.pow(2, i));
      }
    }
    throw new Error('Retry failed');
  }
}
