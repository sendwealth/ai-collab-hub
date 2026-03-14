import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/modules/common/prisma/prisma.service';

describe('TasksController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let apiKey: string;
  let agentId: string;
  let taskId: string;
  let bidId: string;

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

    // Create test agent
    const response = await request(app.getHttpServer())
      .post('/api/v1/agents/register')
      .send({
        name: 'Task Test Agent',
        publicKey: 'task-test-key',
        capabilities: { skills: ['code-review'] },
      });

    apiKey = response.body.apiKey;
    agentId = response.body.agentId;
  });

  afterAll(async () => {
    await prisma.bid.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.agent.deleteMany({});
    await app.close();
  });

  describe('/api/v1/tasks (POST)', () => {
    it('should create a task', () => {
      return request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', apiKey)
        .send({
          title: 'E2E Test Task',
          description: 'Test task description',
          category: 'code-review',
          reward: { credits: 50 },
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('taskId');
          expect(response.body.task.title).toBe('E2E Test Task');
          expect(response.body.task.status).toBe('open');

          taskId = response.body.taskId;
        });
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post('/api/v1/tasks')
        .send({
          title: 'Unauthorized Task',
        })
        .expect(401);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', apiKey)
        .send({})
        .expect(400);
    });
  });

  describe('/api/v1/tasks (GET)', () => {
    it('should return list of tasks', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks')
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('total');
          expect(response.body).toHaveProperty('tasks');
          expect(Array.isArray(response.body.tasks)).toBe(true);
        });
    });

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks?status=open')
        .expect(200)
        .then((response) => {
          response.body.tasks.forEach((task: any) => {
            expect(task.status).toBe('open');
          });
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks?limit=5&offset=0')
        .expect(200);
    });
  });

  describe('/api/v1/tasks/:id (GET)', () => {
    it('should return task details', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/tasks/${taskId}`)
        .expect(200)
        .then((response) => {
          expect(response.body.id).toBe(taskId);
          expect(response.body).toHaveProperty('bids');
        });
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks/non-existent-id')
        .expect(404);
    });
  });

  describe('/api/v1/tasks/:id/bid (POST)', () => {
    it('should create a bid', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/bid`)
        .set('X-API-Key', apiKey)
        .send({
          proposal: 'I can complete this task',
          estimatedTime: 3600,
          estimatedCost: 50,
        })
        .expect(201)
        .then((response) => {
          expect(response.body).toHaveProperty('bidId');
          expect(response.body.bid.proposal).toBe('I can complete this task');

          bidId = response.body.bidId;
        });
    });

    it('should reject duplicate bids', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/bid`)
        .set('X-API-Key', apiKey)
        .send({
          proposal: 'Another bid',
        })
        .expect(409);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/bid`)
        .send({
          proposal: 'Unauthorized bid',
        })
        .expect(401);
    });
  });

  describe('/api/v1/tasks/:id/accept (POST)', () => {
    it('should accept a bid', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/accept`)
        .set('X-API-Key', apiKey)
        .send({ bidId })
        .expect(201)
        .then((response) => {
          expect(response.body.task.status).toBe('assigned');
          expect(response.body.task.assigneeId).toBe(agentId);
        });
    });

    it('should reject if not creator', async () => {
      // Create another agent
      const anotherAgent = await request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'Another Agent',
          publicKey: 'another-key',
        });

      return request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/accept`)
        .set('X-API-Key', anotherAgent.body.apiKey)
        .send({ bidId })
        .expect(403);
    });
  });

  describe('/api/v1/tasks/:id/submit (POST)', () => {
    it('should submit task result', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/submit`)
        .set('X-API-Key', apiKey)
        .send({
          result: {
            review: 'Code looks good',
            issues: [],
            suggestions: ['Add more tests'],
          },
        })
        .expect(201)
        .then((response) => {
          expect(response.body.task.status).toBe('reviewing');
        });
    });

    it('should reject if not assignee', async () => {
      const anotherAgent = await request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'Non-assignee Agent',
          publicKey: 'non-assignee-key',
        });

      return request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/submit`)
        .set('X-API-Key', anotherAgent.body.apiKey)
        .send({
          result: {},
        })
        .expect(403);
    });
  });

  describe('/api/v1/tasks/:id/complete (POST)', () => {
    it('should complete task with rating', () => {
      return request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/complete`)
        .set('X-API-Key', apiKey)
        .send({ rating: 5 })
        .expect(201)
        .then((response) => {
          expect(response.body.task.status).toBe('completed');
        });
    });

    it('should update agent trust score', async () => {
      const agentResponse = await request(app.getHttpServer())
        .get('/api/v1/agents/me')
        .set('X-API-Key', apiKey);

      expect(agentResponse.body.trustScore).toBeGreaterThan(0);
    });
  });

  describe('/api/v1/tasks/me (GET)', () => {
    it('should return my tasks', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks/me')
        .set('X-API-Key', apiKey)
        .expect(200)
        .then((response) => {
          expect(response.body).toHaveProperty('total');
          expect(response.body).toHaveProperty('tasks');
          expect(response.body.total).toBeGreaterThan(0);
        });
    });

    it('should filter by status', () => {
      return request(app.getHttpServer())
        .get('/api/v1/tasks/me?status=completed')
        .set('X-API-Key', apiKey)
        .expect(200)
        .then((response) => {
          response.body.tasks.forEach((task: any) => {
            expect(task.status).toBe('completed');
          });
        });
    });
  });

  describe('Complete Task Flow', () => {
    let flowTaskId: string;
    let flowApiKey: string;

    it('should complete full task lifecycle', async () => {
      // 1. Register agent
      const regResponse = await request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: 'Flow Test Agent',
          publicKey: 'flow-test-key',
          capabilities: { skills: ['testing'] },
        });

      flowApiKey = regResponse.body.apiKey;

      // 2. Create task
      const taskResponse = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', flowApiKey)
        .send({
          title: 'Flow Test Task',
          category: 'testing',
        });

      flowTaskId = taskResponse.body.taskId;
      expect(taskResponse.body.task.status).toBe('open');

      // 3. Bid on task
      const bidResponse = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${flowTaskId}/bid`)
        .set('X-API-Key', flowApiKey)
        .send({
          proposal: 'I will test this',
        });

      expect(bidResponse.body.bid.status).toBe('pending');

      // 4. Accept bid
      const acceptResponse = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${flowTaskId}/accept`)
        .set('X-API-Key', flowApiKey)
        .send({ bidId: bidResponse.body.bidId });

      expect(acceptResponse.body.task.status).toBe('assigned');

      // 5. Submit result
      const submitResponse = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${flowTaskId}/submit`)
        .set('X-API-Key', flowApiKey)
        .send({
          result: { tested: true },
        });

      expect(submitResponse.body.task.status).toBe('reviewing');

      // 6. Complete task
      const completeResponse = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${flowTaskId}/complete`)
        .set('X-API-Key', flowApiKey)
        .send({ rating: 5 });

      expect(completeResponse.body.task.status).toBe('completed');
    });
  });
});
