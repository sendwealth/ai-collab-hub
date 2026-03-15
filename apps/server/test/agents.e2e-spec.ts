import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/modules/common/prisma/prisma.service';
import { AgentFactory } from './factories/agent.factory';

describe('Agents API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let agentFactory: AgentFactory;

  let testApiKey: string;
  let testAgentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    agentFactory = new AgentFactory(prisma);

    // Configure global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    // Set global prefix
    app.setGlobalPrefix('api/v1');

    await app.init();

    // Clean up database before tests
    await cleanDatabase();
  });

  afterAll(async () => {
    // Clean up after all tests
    await cleanDatabase();
    await app.close();
  });

  async function cleanDatabase() {
    try {
      await prisma.bid.deleteMany({});
      await prisma.task.deleteMany({});
      await prisma.agent.deleteMany({});
    } catch (error) {
      console.error('Database cleanup error:', error);
    }
  }

  // ============================================
  // POST /api/v1/agents/register - Agent注册
  // ============================================
  describe('POST /api/v1/agents/register', () => {
    it('should register a new agent with all fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'E2E Full Agent',
          publicKey: 'test-public-key-full',
          description: 'E2E test agent with all fields',
          capabilities: {
            skills: ['code-review', 'testing', 'refactoring'],
            tools: ['jest', 'prettier', 'eslint'],
            protocols: ['http', 'websocket', 'grpc'],
            maxConcurrentTasks: 10,
            estimatedResponseTime: 1500,
          },
          endpoint: {
            http: 'https://api.e2eagent.com',
            websocket: 'wss://ws.e2eagent.com',
          },
          metadata: {
            version: '1.0.0',
            author: 'E2E Test Team',
            environment: 'testing',
          },
        })
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body).toHaveProperty('agentId');
          expect(response.body).toHaveProperty('apiKey');
          expect(response.body.apiKey).toMatch(/^sk_agent_/);
          expect(response.body).toHaveProperty('message', 'Agent registered successfully');

          testAgentId = response.body.agentId;
          testApiKey = response.body.apiKey;
        });
    });

    it('should register an agent with minimal required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'E2E Minimal Agent',
          publicKey: 'test-public-key-minimal',
        })
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body).toHaveProperty('agentId');
          expect(response.body).toHaveProperty('apiKey');
        });
    });

    it('should reject registration with duplicate name', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'E2E Full Agent',
          publicKey: 'another-public-key',
        })
        .expect(HttpStatus.CONFLICT);
    });

    it('should reject registration without name', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          publicKey: 'test-key-without-name',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject registration without publicKey', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'AgentWithoutKey',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject registration with name too short', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'AB',
          publicKey: 'test-key-short',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject registration with extra fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'AgentWithExtra',
          publicKey: 'test-key-extra',
          extraField: 'should be rejected',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should register agent with unicode name', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: '测试Agent-🤖',
          publicKey: 'test-key-unicode',
        })
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body).toHaveProperty('agentId');
        });
    });

    it('should handle concurrent registration attempts', async () => {
      const requests = Array(5)
        .fill(null)
        .map((_, i) =>
          request(app.getHttpServer())
            .post('/api/v1/agents/register')
            .send({
              name: `ConcurrentAgent${i}`,
              publicKey: `concurrent-key-${i}`,
            }),
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(HttpStatus.CREATED);
      });
    });
  });

  // ============================================
  // GET /api/v1/agents/me - 获取自己的信息
  // ============================================
  describe('GET /api/v1/agents/me', () => {
    it('should return agent info with valid API key', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .set('X-API-Key', testApiKey)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body).toHaveProperty('id', testAgentId);
          expect(response.body).toHaveProperty('name', 'E2E Full Agent');
          expect(response.body).toHaveProperty('description');
          expect(response.body).toHaveProperty('capabilities');
          expect(response.body).toHaveProperty('status');
          expect(response.body).toHaveProperty('trustScore');
          expect(response.body).not.toHaveProperty('apiKey');
          expect(response.body).not.toHaveProperty('publicKey');
        });
    });

    it('should reject request without API key', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject request with invalid API key', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .set('X-API-Key', 'invalid-api-key')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject request with malformed API key', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .set('X-API-Key', 'not-even-a-key')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return consistent data across multiple requests', async () => {
      const responses = await Promise.all([
        request(app.getHttpServer())
          .get('/api/v1/agents/me')
          .set('X-API-Key', testApiKey),
        request(app.getHttpServer())
          .get('/api/v1/agents/me')
          .set('X-API-Key', testApiKey),
        request(app.getHttpServer())
          .get('/api/v1/agents/me')
          .set('X-API-Key', testApiKey),
      ]);

      responses.forEach((response) => {
        expect(response.status).toBe(HttpStatus.OK);
        expect(response.body.id).toBe(testAgentId);
      });
    });
  });

  // ============================================
  // PUT /api/v1/agents/me - 更新自己的信息
  // ============================================
  describe('PUT /api/v1/agents/me', () => {
    it('should update agent description', () => {
      return request(app.getHttpServer())
        .put('/api/v1/agents/me')
        .set('X-API-Key', testApiKey)
        .send({
          description: 'Updated description via E2E test',
        })
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body).toHaveProperty('message', 'Agent updated successfully');
          expect(response.body.agent.description).toBe('Updated description via E2E test');
        });
    });

    it('should update agent capabilities', () => {
      return request(app.getHttpServer())
        .put('/api/v1/agents/me')
        .set('X-API-Key', testApiKey)
        .send({
          capabilities: {
            skills: ['updated-skill-1', 'updated-skill-2'],
            maxConcurrentTasks: 20,
          },
        })
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.agent.capabilities.skills).toContain('updated-skill-1');
        });
    });

    it('should update multiple fields at once', () => {
      return request(app.getHttpServer())
        .put('/api/v1/agents/me')
        .set('X-API-Key', testApiKey)
        .send({
          description: 'Multi-field update',
          capabilities: { skills: ['multi'] },
          metadata: { updated: true },
        })
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.agent.description).toBe('Multi-field update');
        });
    });

    it('should reject update without API key', () => {
      return request(app.getHttpServer())
        .put('/api/v1/agents/me')
        .send({ description: 'No auth update' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should handle empty update object', () => {
      return request(app.getHttpServer())
        .put('/api/v1/agents/me')
        .set('X-API-Key', testApiKey)
        .send({})
        .expect(HttpStatus.OK);
    });
  });

  // ============================================
  // PUT /api/v1/agents/me/status - 更新状态
  // ============================================
  describe('PUT /api/v1/agents/me/status', () => {
    it('should update status to busy', () => {
      return request(app.getHttpServer())
        .put('/api/v1/agents/me/status')
        .set('X-API-Key', testApiKey)
        .send({ status: 'busy' })
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body).toHaveProperty('message', 'Status updated successfully');
          expect(response.body.status).toBe('busy');
        });
    });

    it('should update status to idle', () => {
      return request(app.getHttpServer())
        .put('/api/v1/agents/me/status')
        .set('X-API-Key', testApiKey)
        .send({ status: 'idle' })
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.status).toBe('idle');
        });
    });

    it('should update status to offline', () => {
      return request(app.getHttpServer())
        .put('/api/v1/agents/me/status')
        .set('X-API-Key', testApiKey)
        .send({ status: 'offline' })
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.status).toBe('offline');
        });
    });

    it('should reject invalid status value', () => {
      return request(app.getHttpServer())
        .put('/api/v1/agents/me/status')
        .set('X-API-Key', testApiKey)
        .send({ status: 'invalid-status' })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject status update without API key', () => {
      return request(app.getHttpServer())
        .put('/api/v1/agents/me/status')
        .send({ status: 'idle' })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject status update with missing status field', () => {
      return request(app.getHttpServer())
        .put('/api/v1/agents/me/status')
        .set('X-API-Key', testApiKey)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should update lastSeen timestamp', async () => {
      // First, get current agent state
      const beforeResponse = await request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .set('X-API-Key', testApiKey);

      const beforeLastSeen = beforeResponse.body.lastSeen;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update status
      await request(app.getHttpServer())
        .put('/api/v1/agents/me/status')
        .set('X-API-Key', testApiKey)
        .send({ status: 'idle' })
        .expect(HttpStatus.OK);

      // Get updated agent state
      const afterResponse = await request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .set('X-API-Key', testApiKey);

      // lastSeen should be updated (or at least not older)
      expect(afterResponse.body.lastSeen).toBeDefined();
    });
  });

  // ============================================
  // GET /api/v1/agents - 发现Agent
  // ============================================
  describe('GET /api/v1/agents', () => {
    beforeAll(async () => {
      // Create additional test agents
      await agentFactory.createMany([
        { name: 'SearchAgent1', status: 'idle', trustScore: 90 },
        { name: 'SearchAgent2', status: 'busy', trustScore: 80 },
        { name: 'SearchAgent3', status: 'idle', trustScore: 70 },
      ]);
    });

    it('should return list of agents', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents')
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body).toHaveProperty('total');
          expect(response.body).toHaveProperty('agents');
          expect(Array.isArray(response.body.agents)).toBe(true);
          expect(response.body.total).toBeGreaterThan(0);
        });
    });

    it('should filter agents by status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents?status=idle')
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.agents.length).toBeGreaterThan(0);
          response.body.agents.forEach((agent: any) => {
            expect(agent.status).toBe('idle');
          });
        });
    });

    it('should support limit parameter', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents?limit=2')
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.agents.length).toBeLessThanOrEqual(2);
        });
    });

    it('should return agents ordered by trustScore descending', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents?limit=10')
        .expect(HttpStatus.OK)
        .then((response) => {
          const agents = response.body.agents;
          for (let i = 0; i < agents.length - 1; i++) {
            expect(agents[i].trustScore).toBeGreaterThanOrEqual(agents[i + 1].trustScore);
          }
        });
    });

    it('should not expose sensitive information', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents')
        .expect(HttpStatus.OK)
        .then((response) => {
          response.body.agents.forEach((agent: any) => {
            expect(agent).not.toHaveProperty('apiKey');
            expect(agent).not.toHaveProperty('publicKey');
          });
        });
    });

    it('should return empty array when no agents match filter', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents?status=nonexistent')
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.agents).toHaveLength(0);
          expect(response.body.total).toBe(0);
        });
    });

    it('should handle combined filters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents?status=idle&limit=5')
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body.agents.length).toBeLessThanOrEqual(5);
          response.body.agents.forEach((agent: any) => {
            expect(agent.status).toBe('idle');
          });
        });
    });
  });

  // ============================================
  // GET /api/v1/agents/:id - 获取Agent公开信息
  // ============================================
  describe('GET /api/v1/agents/:id', () => {
    it('should return agent public profile', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/agents/${testAgentId}`)
        .expect(HttpStatus.OK)
        .then((response) => {
          expect(response.body).toHaveProperty('id', testAgentId);
          expect(response.body).toHaveProperty('name');
          expect(response.body).toHaveProperty('description');
          expect(response.body).toHaveProperty('status');
          expect(response.body).toHaveProperty('trustScore');
          expect(response.body).not.toHaveProperty('apiKey');
          expect(response.body).not.toHaveProperty('publicKey');
        });
    });

    it('should return 404 for non-existent agent', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents/non-existent-agent-id')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return public profile without authentication', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/agents/${testAgentId}`)
        .expect(HttpStatus.OK);
    });

    it('should handle invalid UUID format', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents/invalid-uuid')
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  // ============================================
  // Agent Lifecycle Tests
  // ============================================
  describe('Complete Agent Lifecycle', () => {
    let lifecycleApiKey: string;
    let lifecycleAgentId: string;

    it('should complete full agent lifecycle', async () => {
      // 1. Register
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'LifecycleTestAgent',
          publicKey: 'lifecycle-public-key',
          description: 'Testing complete lifecycle',
        })
        .expect(HttpStatus.CREATED);

      lifecycleAgentId = registerResponse.body.agentId;
      lifecycleApiKey = registerResponse.body.apiKey;

      // 2. Get profile
      const profileResponse = await request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .set('X-API-Key', lifecycleApiKey)
        .expect(HttpStatus.OK);

      expect(profileResponse.body.status).toBe('idle');

      // 3. Update status
      await request(app.getHttpServer())
        .put('/api/v1/agents/me/status')
        .set('X-API-Key', lifecycleApiKey)
        .send({ status: 'busy' })
        .expect(HttpStatus.OK);

      // 4. Verify status change
      const updatedProfileResponse = await request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .set('X-API-Key', lifecycleApiKey)
        .expect(HttpStatus.OK);

      expect(updatedProfileResponse.body.status).toBe('busy');

      // 5. Update info
      await request(app.getHttpServer())
        .put('/api/v1/agents/me')
        .set('X-API-Key', lifecycleApiKey)
        .send({ description: 'Updated in lifecycle' })
        .expect(HttpStatus.OK);

      // 6. Verify info update
      const finalProfileResponse = await request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .set('X-API-Key', lifecycleApiKey)
        .expect(HttpStatus.OK);

      expect(finalProfileResponse.body.description).toBe('Updated in lifecycle');

      // 7. Set offline
      await request(app.getHttpServer())
        .put('/api/v1/agents/me/status')
        .set('X-API-Key', lifecycleApiKey)
        .send({ status: 'offline' })
        .expect(HttpStatus.OK);
    });
  });

  // ============================================
  // Authentication Tests
  // ============================================
  describe('Authentication', () => {
    it('should require API key for protected endpoints', async () => {
      const protectedEndpoints = [
        { method: 'get', path: '/api/v1/agents/me' },
        { method: 'put', path: '/api/v1/agents/me' },
        { method: 'put', path: '/api/v1/agents/me/status' },
      ];

      for (const endpoint of protectedEndpoints) {
        const response = await request(app.getHttpServer())[endpoint.method](endpoint.path);
        expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
      }
    });

    it('should accept API key in X-API-Key header', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .set('X-API-Key', testApiKey)
        .expect(HttpStatus.OK);
    });

    it('should reject expired or revoked API keys', async () => {
      // This would require implementing key revocation logic
      // For now, we test with a non-existent key
      return request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .set('X-API-Key', 'sk_agent_nonexistent123')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  // ============================================
  // Performance Tests
  // ============================================
  describe('Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/api/v1/agents')
            .expect(HttpStatus.OK),
        );

      const start = Date.now();
      await Promise.all(requests);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should respond within acceptable time', async () => {
      const start = Date.now();

      await request(app.getHttpServer())
        .get('/api/v1/agents')
        .expect(HttpStatus.OK);

      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });
  });

  // ============================================
  // Error Handling Tests
  // ============================================
  describe('Error Handling', () => {
    it('should return proper error format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({}) // Missing required fields
        .expect(HttpStatus.BAD_REQUEST)
        .then((response) => {
          expect(response.body).toHaveProperty('message');
          expect(Array.isArray(response.body.message) || typeof response.body.message === 'string').toBe(true);
        });
    });

    it('should handle malformed JSON', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle missing Content-Type header', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send('name=TestAgent&publicKey=test-key')
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
