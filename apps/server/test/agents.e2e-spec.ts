import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/modules/common/prisma/prisma.service';

describe('AgentsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let apiKey: string;
  let agentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.bid.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.agent.deleteMany({});
    await app.close();
  });

  describe('/api/v1/agents/register (POST)', () => {
    it('should register a new agent', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'E2E Test Agent',
          publicKey: 'test-public-key-e2e',
          description: 'E2E test agent',
          capabilities: {
            skills: ['code-review', 'testing'],
            tools: ['jest', 'supertest'],
          },
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('agentId');
          expect(response.body).toHaveProperty('apiKey');
          expect(response.body.apiKey).toMatch(/^sk_agent_/);

          agentId = response.body.agentId;
          apiKey = response.body.apiKey;
        });
    });

    it('should reject duplicate agent name', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'E2E Test Agent',
          publicKey: 'another-key',
        })
        .expect(409);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          description: 'Missing name and publicKey',
        })
        .expect(400);
    });

    it('should validate name length', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'AB', // Too short
          publicKey: 'test-key',
        })
        .expect(400);
    });
  });

  describe('/api/v1/agents/me (GET)', () => {
    it('should return agent info with valid API key', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .set('X-API-Key', apiKey)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('id', agentId);
          expect(response.body).toHaveProperty('name', 'E2E Test Agent');
        });
    });

    it('should reject request without API key', () => {
      return request(app.getHttpServer()).get('/api/v1/agents/me').expect(401);
    });

    it('should reject request with invalid API key', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .set('X-API-Key', 'invalid-key')
        .expect(401);
    });
  });

  describe('/api/v1/agents/me/status (PUT)', () => {
    it('should update agent status', () => {
      return request(app.getHttpServer())
        .put('/api/v1/agents/me/status')
        .set('X-API-Key', apiKey)
        .send({ status: 'busy' })
        .expect(200)
        .then((response) => {
          expect(response.body.status).toBe('busy');
        });
    });

    it('should reject invalid status', () => {
      return request(app.getHttpServer())
        .put('/api/v1/agents/me/status')
        .set('X-API-Key', apiKey)
        .send({ status: 'invalid' })
        .expect(400);
    });
  });

  describe('/api/v1/agents (GET)', () => {
    it('should return list of agents', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('total');
          expect(response.body).toHaveProperty('agents');
          expect(Array.isArray(response.body.agents)).toBe(true);
        });
    });

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents?status=busy')
        .expect(200)
        .then((response) => {
          response.body.agents.forEach((agent: any) => {
            expect(agent.status).toBe('busy');
          });
        });
    });

    it('should support limit parameter', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents?limit=5')
        .expect(200);
    });
  });

  describe('/api/v1/agents/:id (GET)', () => {
    it('should return agent public profile', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/agents/${agentId}`)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('id', agentId);
          expect(response.body).toHaveProperty('name');
          expect(response.body).not.toHaveProperty('apiKey'); // Should not expose sensitive data
        });
    });

    it('should return 404 for non-existent agent', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents/non-existent-id')
        .expect(404);
    });
  });
});
