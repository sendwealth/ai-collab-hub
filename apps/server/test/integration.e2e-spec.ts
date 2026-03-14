import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/modules/common/prisma/prisma.service';

describe('API Integration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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
    try {
      await prisma.bid.deleteMany({});
      await prisma.task.deleteMany({});
      await prisma.agent.deleteMany({});
    } catch (error) {
      // Ignore cleanup errors
    }
    await app.close();
  });

  describe('Agent Registration Flow', () => {
    let apiKey: string;

    it('should register a new agent', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'Integration Test Agent',
          publicKey: 'integration-test-key',
          capabilities: {
            skills: ['testing', 'integration'],
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('agentId');
      expect(response.body).toHaveProperty('apiKey');
      expect(response.body.apiKey).toMatch(/^sk_agent_/);

      apiKey = response.body.apiKey;
    });

    it('should get agent info with valid API key', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Integration Test Agent');
    });

    it('should update agent status', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/agents/me/status')
        .set('X-API-Key', apiKey)
        .send({ status: 'busy' })
        .expect(200);

      expect(response.body.status).toBe('busy');
    });
  });

  describe('Task Flow', () => {
    let apiKey: string;
    let taskId: string;

    beforeAll(async () => {
      // Register agent for tests
      const response = await request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'Task Test Agent',
          publicKey: 'task-test-key',
        });

      apiKey = response.body.apiKey;
    });

    it('should create a task', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', apiKey)
        .send({
          title: 'Integration Test Task',
          description: 'Test task description',
          category: 'testing',
        })
        .expect(201);

      expect(response.body).toHaveProperty('taskId');
      taskId = response.body.taskId;
    });

    it('should get task details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tasks/${taskId}`)
        .expect(200);

      expect(response.body.id).toBe(taskId);
      expect(response.body.title).toBe('Integration Test Task');
    });

    it('should bid on task', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/bid`)
        .set('X-API-Key', apiKey)
        .send({
          proposal: 'I will test this',
          estimatedTime: 1800,
        })
        .expect(201);

      expect(response.body).toHaveProperty('bidId');
    });

    it('should get my tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks/me')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body.total).toBeGreaterThan(0);
    });
  });

  describe('Validation Tests', () => {
    it('should reject registration without required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({})
        .expect(400);
    });

    it('should reject invalid status', () => {
      return request(app.getHttpServer())
        .put('/api/v1/agents/me/status')
        .set('X-API-Key', 'test-key')
        .send({ status: 'invalid' })
        .expect(401); // Unauthorized due to invalid key
    });

    it('should reject task creation without auth', () => {
      return request(app.getHttpServer())
        .post('/api/v1/tasks')
        .send({ title: 'Test' })
        .expect(401);
    });
  });
});
