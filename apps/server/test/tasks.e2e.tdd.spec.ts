/**
 * E2E Tests for Task System
 * Complete end-to-end testing of Task API endpoints
 * 
 * Test Coverage:
 * - POST /api/v1/tasks - Create task
 * - GET /api/v1/tasks - List tasks
 * - GET /api/v1/tasks/me - Get my tasks
 * - GET /api/v1/tasks/:id - Get task details
 * - POST /api/v1/tasks/:id/bid - Bid on task
 * - POST /api/v1/tasks/:id/accept - Accept bid
 * - POST /api/v1/tasks/:id/submit - Submit task result
 * - POST /api/v1/tasks/:id/complete - Complete task
 * - Complete task lifecycle scenarios
 * - Multi-agent scenarios
 * - Error handling
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/common/prisma/prisma.service';

describe('Task System E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let creatorApiKey: string;
  let creatorAgentId: string;
  let assigneeApiKey: string;
  let assigneeAgentId: string;

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
    await prisma.bid.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.agent.deleteMany({});
    await app.close();
  });

  // ============================================
  // SETUP
  // ============================================
  describe('Setup', () => {
    it('should register creator agent', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: `creator-${Date.now()}`,
          publicKey: `creator-key-${Date.now()}`,
          description: 'Test creator agent',
          capabilities: { skills: ['task-creation'] },
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('apiKey');
      expect(response.body).toHaveProperty('agentId');

      creatorApiKey = response.body.apiKey;
      creatorAgentId = response.body.agentId;
    });

    it('should register assignee agent', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: `assignee-${Date.now()}`,
          publicKey: `assignee-key-${Date.now()}`,
          description: 'Test assignee agent',
          capabilities: { skills: ['task-execution'] },
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('apiKey');
      expect(response.body).toHaveProperty('agentId');

      assigneeApiKey = response.body.apiKey;
      assigneeAgentId = response.body.agentId;
    });
  });

  // ============================================
  // TASK CREATION TESTS
  // ============================================
  describe('POST /api/v1/tasks', () => {
    it('should create a task successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'E2E Test Task',
          description: 'Test task description',
          category: 'testing',
          type: 'independent',
          reward: { credits: 100 },
          requirements: { skills: ['jest', 'typescript'] },
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('taskId');
      expect(response.body.task.title).toBe('E2E Test Task');
      expect(response.body.task.status).toBe('open');
      expect(response.body.task.requirements).toEqual({
        skills: ['jest', 'typescript'],
      });
    });

    it('should create task with minimal fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'Minimal Task',
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.taskId).toBeDefined();
      expect(response.body.task.title).toBe('Minimal Task');
    });

    it('should create collaborative task', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'Collaborative Task',
          type: 'collaborative',
          requirements: { maxAgents: 5 },
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.task.type).toBe('collaborative');
    });

    it('should create workflow task', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'Workflow Task',
          type: 'workflow',
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.task.type).toBe('workflow');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .send({
          title: 'Unauthorized Task',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should validate task type', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'Invalid Type Task',
          type: 'invalid-type',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should accept valid deadline', async () => {
      const deadline = new Date('2025-12-31T23:59:59.000Z');

      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'Task with Deadline',
          deadline: deadline.toISOString(),
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.task.deadline).toBeDefined();
    });
  });

  // ============================================
  // TASK LISTING TESTS
  // ============================================
  describe('GET /api/v1/tasks', () => {
    beforeAll(async () => {
      // Create test tasks
      await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'Open Task',
          category: 'development',
          status: 'open',
        });

      await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'Testing Task',
          category: 'testing',
        });
    });

    it('should return list of tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks')
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('tasks');
      expect(Array.isArray(response.body.tasks)).toBe(true);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks?status=open')
        .expect(HttpStatus.OK);

      response.body.tasks.forEach((task: any) => {
        expect(task.status).toBe('open');
      });
    });

    it('should filter by category', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks?category=testing')
        .expect(HttpStatus.OK);

      response.body.tasks.forEach((task: any) => {
        expect(task.category).toBe('testing');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks?limit=5&offset=0')
        .expect(HttpStatus.OK);

      expect(response.body.tasks.length).toBeLessThanOrEqual(5);
    });

    it('should support combined filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks?status=open&category=development&limit=10')
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('tasks');
    });
  });

  // ============================================
  // TASK DETAILS TESTS
  // ============================================
  describe('GET /api/v1/tasks/:id', () => {
    let testTaskId: string;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'Detail Test Task',
          description: 'Task for detail testing',
        });

      testTaskId = response.body.taskId;
    });

    it('should return task details', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tasks/${testTaskId}`)
        .expect(HttpStatus.OK);

      expect(response.body.id).toBe(testTaskId);
      expect(response.body.title).toBe('Detail Test Task');
      expect(response.body).toHaveProperty('bids');
    });

    it('should return 404 for non-existent task', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tasks/non-existent-id')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should include creator information', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tasks/${testTaskId}`)
        .expect(HttpStatus.OK);

      expect(response.body.creator).toBeDefined();
      expect(response.body.creator.id).toBeDefined();
    });

    it('should include bid count', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/tasks/${testTaskId}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('bids');
    });
  });

  // ============================================
  // MY TASKS TESTS
  // ============================================
  describe('GET /api/v1/tasks/me', () => {
    beforeAll(async () => {
      // Create tasks as creator
      await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'My Task 1',
        });

      await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'My Task 2',
        });
    });

    it('should return my tasks', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks/me')
        .set('X-API-Key', creatorApiKey)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('tasks');
      expect(response.body.total).toBeGreaterThan(0);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tasks/me')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks/me?status=open')
        .set('X-API-Key', creatorApiKey)
        .expect(HttpStatus.OK);

      response.body.tasks.forEach((task: any) => {
        expect(task.status).toBe('open');
      });
    });

    it('should filter by role (creator)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks/me?role=creator')
        .set('X-API-Key', creatorApiKey)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('tasks');
    });
  });

  // ============================================
  // TASK BIDDING TESTS
  // ============================================
  describe('POST /api/v1/tasks/:id/bid', () => {
    let testTaskId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'Biddable Task',
        });

      testTaskId = response.body.taskId;
    });

    it('should create a bid', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/bid`)
        .set('X-API-Key', assigneeApiKey)
        .send({
          proposal: 'I can complete this task',
          estimatedTime: 3600,
          estimatedCost: 50,
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('bidId');
      expect(response.body.bid.proposal).toBe('I can complete this task');
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/bid`)
        .send({
          proposal: 'Unauthorized bid',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should reject duplicate bids', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/bid`)
        .set('X-API-Key', assigneeApiKey)
        .send({
          proposal: 'First bid',
        });

      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/bid`)
        .set('X-API-Key', assigneeApiKey)
        .send({
          proposal: 'Second bid',
        })
        .expect(HttpStatus.CONFLICT);
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/bid`)
        .set('X-API-Key', assigneeApiKey)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 404 for non-existent task', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tasks/non-existent/bid')
        .set('X-API-Key', assigneeApiKey)
        .send({
          proposal: 'Test',
        })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  // ============================================
  // TASK ASSIGNMENT TESTS
  // ============================================
  describe('POST /api/v1/tasks/:id/accept', () => {
    let testTaskId: string;
    let testBidId: string;

    beforeEach(async () => {
      // Create task
      const taskResponse = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'Assignable Task',
        });

      testTaskId = taskResponse.body.taskId;

      // Create bid
      const bidResponse = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/bid`)
        .set('X-API-Key', assigneeApiKey)
        .send({
          proposal: 'I can do this',
        });

      testBidId = bidResponse.body.bidId;
    });

    it('should accept a bid', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/accept`)
        .set('X-API-Key', creatorApiKey)
        .send({ bidId: testBidId })
        .expect(HttpStatus.CREATED);

      expect(response.body.task.status).toBe('assigned');
      expect(response.body.task.assigneeId).toBe(assigneeAgentId);
    });

    it('should reject if not creator', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/accept`)
        .set('X-API-Key', assigneeApiKey)
        .send({ bidId: testBidId })
        .expect(HttpStatus.CONFLICT);
    });

    it('should return 404 for non-existent bid', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/accept`)
        .set('X-API-Key', creatorApiKey)
        .send({ bidId: 'non-existent-bid' })
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  // ============================================
  // TASK SUBMISSION TESTS
  // ============================================
  describe('POST /api/v1/tasks/:id/submit', () => {
    let testTaskId: string;

    beforeEach(async () => {
      // Create and assign task
      const taskResponse = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'Submittable Task',
        });

      testTaskId = taskResponse.body.taskId;

      const bidResponse = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/bid`)
        .set('X-API-Key', assigneeApiKey)
        .send({
          proposal: 'I will do this',
        });

      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/accept`)
        .set('X-API-Key', creatorApiKey)
        .send({ bidId: bidResponse.body.bidId });
    });

    it('should submit task result', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/submit`)
        .set('X-API-Key', assigneeApiKey)
        .send({
          result: {
            code: 'completed',
            files: ['test.js'],
            coverage: 95,
          },
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.task.status).toBe('reviewing');
    });

    it('should reject if not assignee', async () => {
      const anotherAgent = await request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: `non-assignee-${Date.now()}`,
          publicKey: `non-assignee-key-${Date.now()}`,
        });

      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/submit`)
        .set('X-API-Key', anotherAgent.body.apiKey)
        .send({
          result: {},
        })
        .expect(HttpStatus.CONFLICT);
    });

    it('should validate result field', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/submit`)
        .set('X-API-Key', assigneeApiKey)
        .send({})
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  // ============================================
  // TASK COMPLETION TESTS
  // ============================================
  describe('POST /api/v1/tasks/:id/complete', () => {
    let testTaskId: string;

    beforeEach(async () => {
      // Create, assign, and submit task
      const taskResponse = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'Completable Task',
        });

      testTaskId = taskResponse.body.taskId;

      const bidResponse = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/bid`)
        .set('X-API-Key', assigneeApiKey)
        .send({
          proposal: 'I will complete this',
        });

      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/accept`)
        .set('X-API-Key', creatorApiKey)
        .send({ bidId: bidResponse.body.bidId });

      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/submit`)
        .set('X-API-Key', assigneeApiKey)
        .send({
          result: { code: 'done' },
        });
    });

    it('should complete task with rating', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/complete`)
        .set('X-API-Key', creatorApiKey)
        .send({ rating: 5 })
        .expect(HttpStatus.CREATED);

      expect(response.body.task.status).toBe('completed');
    });

    it('should reject if not creator', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${testTaskId}/complete`)
        .set('X-API-Key', assigneeApiKey)
        .send({ rating: 5 })
        .expect(HttpStatus.CONFLICT);
    });

    it('should accept rating range 1-5', async () => {
      for (const rating of [1, 2, 3, 4, 5]) {
        const taskResponse = await request(app.getHttpServer())
          .post('/api/v1/tasks')
          .set('X-API-Key', creatorApiKey)
          .send({
            title: `Task with rating ${rating}`,
          });

        const taskId = taskResponse.body.taskId;

        const bidResponse = await request(app.getHttpServer())
          .post(`/api/v1/tasks/${taskId}/bid`)
          .set('X-API-Key', assigneeApiKey)
          .send({
            proposal: 'Test',
          });

        await request(app.getHttpServer())
          .post(`/api/v1/tasks/${taskId}/accept`)
          .set('X-API-Key', creatorApiKey)
          .send({ bidId: bidResponse.body.bidId });

        await request(app.getHttpServer())
          .post(`/api/v1/tasks/${taskId}/submit`)
          .set('X-API-Key', assigneeApiKey)
          .send({
            result: {},
          });

        await request(app.getHttpServer())
          .post(`/api/v1/tasks/${taskId}/complete`)
          .set('X-API-Key', creatorApiKey)
          .send({ rating })
          .expect(HttpStatus.CREATED);
      }
    });
  });

  // ============================================
  // COMPLETE TASK LIFECYCLE
  // ============================================
  describe('Complete Task Lifecycle', () => {
    it('should complete full task lifecycle', async () => {
      // 1. Register agents
      const creator = await request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: `lifecycle-creator-${Date.now()}`,
          publicKey: `lc-key-${Date.now()}`,
        });

      const assignee = await request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: `lifecycle-assignee-${Date.now()}`,
          publicKey: `la-key-${Date.now()}`,
        });

      // 2. Create task
      const taskResponse = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creator.body.apiKey)
        .send({
          title: 'Lifecycle Test Task',
          category: 'testing',
        });

      const taskId = taskResponse.body.taskId;
      expect(taskResponse.body.task.status).toBe('open');

      // 3. Bid on task
      const bidResponse = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/bid`)
        .set('X-API-Key', assignee.body.apiKey)
        .send({
          proposal: 'I will test this',
        });

      expect(bidResponse.body.bid.status).toBe('pending');

      // 4. Accept bid
      const acceptResponse = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/accept`)
        .set('X-API-Key', creator.body.apiKey)
        .send({ bidId: bidResponse.body.bidId });

      expect(acceptResponse.body.task.status).toBe('assigned');

      // 5. Submit result
      const submitResponse = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/submit`)
        .set('X-API-Key', assignee.body.apiKey)
        .send({
          result: { tested: true },
        });

      expect(submitResponse.body.task.status).toBe('reviewing');

      // 6. Complete task
      const completeResponse = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/complete`)
        .set('X-API-Key', creator.body.apiKey)
        .send({ rating: 5 });

      expect(completeResponse.body.task.status).toBe('completed');

      // 7. Verify final state
      const finalTask = await request(app.getHttpServer())
        .get(`/api/v1/tasks/${taskId}`)
        .expect(HttpStatus.OK);

      expect(finalTask.body.status).toBe('completed');
      expect(finalTask.body.result.rating).toBe(5);
    });
  });

  // ============================================
  // MULTI-AGENT SCENARIOS
  // ============================================
  describe('Multi-Agent Scenarios', () => {
    it('should handle multiple agents bidding', async () => {
      // Create task
      const taskResponse = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'Popular Task',
        });

      const taskId = taskResponse.body.taskId;

      // Create multiple agents
      const agents = await Promise.all([
        request(app.getHttpServer())
          .post('/api/v1/agents/register')
          .send({
            name: `agent1-${Date.now()}`,
            publicKey: `key1-${Date.now()}`,
          }),
        request(app.getHttpServer())
          .post('/api/v1/agents/register')
          .send({
            name: `agent2-${Date.now()}`,
            publicKey: `key2-${Date.now()}`,
          }),
        request(app.getHttpServer())
          .post('/api/v1/agents/register')
          .send({
            name: `agent3-${Date.now()}`,
            publicKey: `key3-${Date.now()}`,
          }),
      ]);

      // All agents bid
      const bids = await Promise.all(
        agents.map(agent =>
          request(app.getHttpServer())
            .post(`/api/v1/tasks/${taskId}/bid`)
            .set('X-API-Key', agent.body.apiKey)
            .send({
              proposal: 'I can do this',
            })
        )
      );

      bids.forEach(bid => {
        expect(bid.status).toBe(HttpStatus.CREATED);
      });

      // Verify all bids exist
      const taskDetails = await request(app.getHttpServer())
        .get(`/api/v1/tasks/${taskId}`)
        .expect(HttpStatus.OK);

      expect(taskDetails.body.bids).toHaveLength(3);
    });

    it('should assign to chosen agent from multiple bids', async () => {
      // Create task
      const taskResponse = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'Multi-Bid Task',
        });

      const taskId = taskResponse.body.taskId;

      // Create agents
      const agent1 = await request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: `agent1-${Date.now()}`,
          publicKey: `key1-${Date.now()}`,
        });

      const agent2 = await request(app.getHttpServer())
        .post('/api/v1/agents/register')
        .send({
          name: `agent2-${Date.now()}`,
          publicKey: `key2-${Date.now()}`,
        });

      // Both agents bid
      const bid1 = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/bid`)
        .set('X-API-Key', agent1.body.apiKey)
        .send({
          proposal: 'Bid 1',
        });

      const bid2 = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/bid`)
        .set('X-API-Key', agent2.body.apiKey)
        .send({
          proposal: 'Bid 2',
        });

      // Accept bid from agent2
      const acceptResponse = await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/accept`)
        .set('X-API-Key', creatorApiKey)
        .send({ bidId: bid2.body.bidId });

      expect(acceptResponse.body.task.assigneeId).toBe(agent2.body.agentId);
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================
  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/tasks/non-existent-id')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return 401 for missing authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .send({
          title: 'Unauthorized Task',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return 400 for invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: '',
          type: 'invalid-type',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 409 for conflicts', async () => {
      // Create task
      const taskResponse = await request(app.getHttpServer())
        .post('/api/v1/tasks')
        .set('X-API-Key', creatorApiKey)
        .send({
          title: 'Conflict Test Task',
        });

      const taskId = taskResponse.body.taskId;

      // First bid
      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/bid`)
        .set('X-API-Key', assigneeApiKey)
        .send({
          proposal: 'First bid',
        });

      // Duplicate bid
      await request(app.getHttpServer())
        .post(`/api/v1/tasks/${taskId}/bid`)
        .set('X-API-Key', assigneeApiKey)
        .send({
          proposal: 'Second bid',
        })
        .expect(HttpStatus.CONFLICT);
    });
  });

  // ============================================
  // PRICING ENDPOINTS
  // ============================================
  describe('Pricing Endpoints', () => {
    it('should get pricing suggestion', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/tasks/pricing')
        .send({
          category: 'development',
          description: 'Build a REST API',
          requirements: {
            skills: ['typescript', 'node.js'],
          },
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toBeDefined();
    });

    it('should get market price', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks/pricing/market')
        .query({ categories: ['development', 'testing'] })
        .expect(HttpStatus.OK);

      expect(response.body).toBeDefined();
    });
  });
});
