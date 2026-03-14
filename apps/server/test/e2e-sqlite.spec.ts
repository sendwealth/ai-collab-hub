import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/modules/common/prisma/prisma.service';
import { execSync } from 'child_process';

describe('E2E Tests with SQLite', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    // Setup test database
    process.env.DATABASE_URL = 'file:./test.db';
    process.env.NODE_ENV = 'test';

    // Run migrations
    try {
      execSync('npx prisma migrate deploy', {
        env: { ...process.env, DATABASE_URL: 'file:./test.db' },
        stdio: 'ignore',
      });
    } catch (error) {
      // Ignore migration errors for SQLite file database
    }

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
    
    // Clean database
    await prisma.bid.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.agent.deleteMany({});
  });

  afterAll(async () => {
    // Clean up
    await prisma.bid.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.agent.deleteMany({});
    
    await app.close();
    
    // Delete test database
    try {
      const fs = require('fs');
      fs.unlinkSync('./test.db');
    } catch (error) {
      // Ignore deletion errors
    }
  });

  describe('Health Check', () => {
    it('/api/v1 (GET) - should return welcome message', () => {
      return request(app.getHttpServer())
        .get('/api/v1')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('/api/v1/agents (GET) - should return agents list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('agents');
          expect(Array.isArray(res.body.agents)).toBe(true);
        });
    });

    it('/api/v1/tasks (GET) - should return tasks list', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('tasks');
          expect(Array.isArray(res.body.tasks)).toBe(true);
        });
    });
  });

  describe('Agent Registration Flow', () => {
    let apiKey: string;
    let agentId: string;

    it('should register a new agent', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'E2E Test Agent',
          publicKey: 'e2e-test-key',
          description: 'E2E test agent',
          capabilities: {
            skills: ['testing', 'e2e'],
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty('agentId');
      expect(response.body).toHaveProperty('apiKey');
      expect(response.body.apiKey).toMatch(/^sk_agent_/);

      apiKey = response.body.apiKey;
      agentId = response.body.agentId;
    });

    it('should reject duplicate agent name', async () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'E2E Test Agent',
          publicKey: 'another-key',
        })
        .expect(409);
    });

    it('should get agent info with valid API key', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body).toHaveProperty('id', agentId);
      expect(response.body).toHaveProperty('name', 'E2E Test Agent');
    });

    it('should reject request without API key', async () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .expect(401);
    });

    it('should update agent status', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/v1/agents/me/status')
        .set('X-API-Key', apiKey)
        .send({ status: 'busy' })
        .expect(200);

      expect(response.body.status).toBe('busy');
    });

    it('should get agent public profile', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/agents/${agentId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', agentId);
      expect(response.body).not.toHaveProperty('apiKey');
    });
  });

  describe('Task Flow', () => {
    let apiKey: string;
    let taskId: string;
    let bidId: string;

    beforeAll(async () => {
      // Register agent for task tests
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
          title: 'E2E Test Task',
          description: 'Test task description',
          category: 'testing',
          reward: { credits: 100 },
        })
        .expect(201);

      expect(response.body).toHaveProperty('taskId');
      expect(response.body.task.title).toBe('E2E Test Task');
      expect(response.body.task.status).toBe('open');

      taskId = response.body.taskId;
    });

    it('should get task details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tasks/${taskId}`)
        .expect(200);

      expect(response.body.id).toBe(taskId);
      expect(response.body.title).toBe('E2E Test Task');
    });

    it('should bid on task', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/bid`)
        .set('X-API-Key', apiKey)
        .send({
          proposal: 'I can complete this task',
          estimatedTime: 3600,
        })
        .expect(201);

      expect(response.body).toHaveProperty('bidId');
      expect(response.body.bid.status).toBe('pending');

      bidId = response.body.bidId;
    });

    it('should reject duplicate bids', async () => {
      return request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/bid`)
        .set('X-API-Key', apiKey)
        .send({
          proposal: 'Another bid',
        })
        .expect(409);
    });

    it('should accept bid', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/accept`)
        .set('X-API-Key', apiKey)
        .send({ bidId })
        .expect(201);

      expect(response.body.task.status).toBe('assigned');
      expect(response.body.task.assigneeId).toBeDefined();
    });

    it('should submit task result', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/submit`)
        .set('X-API-Key', apiKey)
        .send({
          result: {
            review: 'Task completed successfully',
            issues: [],
            suggestions: [],
          },
        })
        .expect(201);

      expect(response.body.task.status).toBe('reviewing');
    });

    it('should complete task with rating', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/complete`)
        .set('X-API-Key', apiKey)
        .send({ rating: 5 })
        .expect(201);

      expect(response.body.task.status).toBe('completed');
    });

    it('should get my tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks/me')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body.total).toBeGreaterThan(0);
      expect(response.body.tasks).toBeDefined();
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });
  });

  describe('Validation Tests', () => {
    it('should reject registration without required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({})
        .expect(400);
    });

    it('should reject short agent name', () => {
      return request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'AB',
          publicKey: 'test-key',
        })
        .expect(400);
    });

    it('should reject task creation without auth', () => {
      return request(app.getHttpServer())
        .post('/api/v1/tasks')
        .send({ title: 'Test' })
        .expect(401);
    });

    it('should reject invalid status', () => {
      return request(app.getHttpServer())
        .put('/api/v1/agents/me/status')
        .set('X-API-Key', 'invalid-key')
        .send({ status: 'invalid' })
        .expect(401);
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks/non-existent-id')
        .expect(404);
    });

    it('should return 404 for non-existent agent', () => {
      return request(app.getHttpServer())
        .get('/api/v1/agents/non-existent-id')
        .expect(404);
    });
  });

  describe('Filter and Pagination', () => {
    it('should filter agents by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/agents?status=busy')
        .expect(200);

      response.body.agents.forEach((agent: any) => {
        expect(agent.status).toBe('busy');
      });
    });

    it('should filter tasks by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks?status=completed')
        .expect(200);

      response.body.tasks.forEach((task: any) => {
        expect(task.status).toBe('completed');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks?limit=5&offset=0')
        .expect(200);

      expect(response.body.tasks.length).toBeLessThanOrEqual(5);
    });
  });
});
