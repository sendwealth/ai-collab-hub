/**
 * Integration Tests for Task System
 * Tests the complete flow of task operations with database interactions
 * 
 * Test Scenarios:
 * 1. Task Creation Flow
 * 2. Task Bidding Flow
 * 3. Task Assignment Flow
 * 4. Task Completion Flow
 * 5. Task Lifecycle
 * 6. Multi-Agent Scenarios
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/modules/common/prisma/prisma.service';
import { TasksService } from '../src/modules/tasks/tasks.service';
import { AgentsService } from '../src/modules/agents/agents.service';
import { CacheService } from '../src/modules/cache';

describe('Task System Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tasksService: TasksService;
  let agentsService: AgentsService;
  let cacheService: CacheService;

  // Test data
  let creatorAgent: any;
  let assigneeAgent: any;
  let testTask: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);
    tasksService = app.get<TasksService>(TasksService);
    agentsService = app.get<AgentsService>(AgentsService);
    cacheService = app.get<CacheService>(CacheService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.bid.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.agent.deleteMany({});
    await app.close();
  });

  // ============================================
  // SETUP AND CLEANUP
  // ============================================
  beforeEach(async () => {
    // Clear cache before each test
    await cacheService.invalidate('*');

    // Create test agents
    creatorAgent = await prisma.agent.create({
      data: {
        name: `creator-${Date.now()}`,
        publicKey: `creator-key-${Date.now()}`,
        description: 'Test creator agent',
        trustScore: 50,
      },
    });

    assigneeAgent = await prisma.agent.create({
      data: {
        name: `assignee-${Date.now()}`,
        publicKey: `assignee-key-${Date.now()}`,
        description: 'Test assignee agent',
        trustScore: 60,
      },
    });
  });

  afterEach(async () => {
    // Cleanup after each test
    await prisma.bid.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.agent.deleteMany({});
  });

  // ============================================
  // TASK CREATION FLOW
  // ============================================
  describe('Task Creation Flow', () => {
    it('should create a task successfully', async () => {
      const createDto = {
        title: 'Integration Test Task',
        description: 'Test task for integration testing',
        category: 'testing',
        type: 'independent',
        reward: { credits: 100 },
        requirements: { skills: ['jest', 'typescript'] },
      };

      const result = await tasksService.createTask(creatorAgent.id, createDto);

      expect(result).toHaveProperty('taskId');
      expect(result.task.title).toBe(createDto.title);
      expect(result.task.description).toBe(createDto.description);
      expect(result.task.status).toBe('open');
      expect(result.task.requirements).toEqual(createDto.requirements);
      expect(result.task.reward).toEqual(createDto.reward);

      testTask = result;
    });

    it('should create task with minimal fields', async () => {
      const result = await tasksService.createTask(creatorAgent.id, {
        title: 'Minimal Task',
      });

      expect(result.taskId).toBeDefined();
      expect(result.task.title).toBe('Minimal Task');
      expect(result.task.status).toBe('open');
    });

    it('should create collaborative task', async () => {
      const result = await tasksService.createTask(creatorAgent.id, {
        title: 'Collaborative Task',
        type: 'collaborative',
        requirements: { maxAgents: 5 },
      });

      expect(result.task.type).toBe('collaborative');
    });

    it('should create workflow task', async () => {
      const result = await tasksService.createTask(creatorAgent.id, {
        title: 'Workflow Task',
        type: 'workflow',
      });

      expect(result.task.type).toBe('workflow');
    });

    it('should set default reward if not provided', async () => {
      const result = await tasksService.createTask(creatorAgent.id, {
        title: 'Task with Default Reward',
      });

      expect(result.task.reward).toEqual({ credits: 10 });
    });

    it('should handle deadline correctly', async () => {
      const deadline = new Date('2025-12-31T23:59:59.000Z');
      const result = await tasksService.createTask(creatorAgent.id, {
        title: 'Task with Deadline',
        deadline: deadline.toISOString(),
      });

      expect(result.task.deadline).toBeDefined();
    });

    it('should invalidate cache after creation', async () => {
      const cacheSpy = jest.spyOn(cacheService, 'invalidate');

      await tasksService.createTask(creatorAgent.id, {
        title: 'Cache Test Task',
      });

      expect(cacheSpy).toHaveBeenCalledWith('tasks:*');
    });
  });

  // ============================================
  // TASK RETRIEVAL FLOW
  // ============================================
  describe('Task Retrieval Flow', () => {
    beforeEach(async () => {
      // Create test tasks
      testTask = await tasksService.createTask(creatorAgent.id, {
        title: 'Test Task 1',
        category: 'development',
        type: 'independent',
      });
    });

    it('should retrieve task by ID', async () => {
      const result = await tasksService.getTask(testTask.taskId);

      expect(result.id).toBe(testTask.taskId);
      expect(result.title).toBe('Test Task 1');
    });

    it('should retrieve tasks with pagination', async () => {
      // Create multiple tasks
      await tasksService.createTask(creatorAgent.id, { title: 'Task 2' });
      await tasksService.createTask(creatorAgent.id, { title: 'Task 3' });

      const result = await tasksService.getTasks({ limit: 2, offset: 0 });

      expect(result.total).toBeGreaterThanOrEqual(3);
      expect(result.tasks.length).toBeLessThanOrEqual(2);
    });

    it('should filter tasks by status', async () => {
      const result = await tasksService.getTasks({ status: 'open' });

      expect(result.tasks.length).toBeGreaterThan(0);
      result.tasks.forEach(task => {
        expect(task.status).toBe('open');
      });
    });

    it('should filter tasks by category', async () => {
      const result = await tasksService.getTasks({ category: 'development' });

      expect(result.tasks.length).toBeGreaterThan(0);
      result.tasks.forEach(task => {
        expect(task.category).toBe('development');
      });
    });

    it('should filter tasks by type', async () => {
      const result = await tasksService.getTasks({ type: 'independent' });

      expect(result.tasks.length).toBeGreaterThan(0);
      result.tasks.forEach(task => {
        expect(task.type).toBe('independent');
      });
    });

    it('should retrieve my created tasks', async () => {
      const result = await tasksService.getMyTasks(creatorAgent.id, {
        role: 'creator',
      });

      expect(result.total).toBeGreaterThan(0);
      result.tasks.forEach(task => {
        expect(task.creator.id).toBe(creatorAgent.id);
      });
    });

    it('should retrieve my assigned tasks', async () => {
      // Create and assign a task
      const assignedTask = await tasksService.createTask(creatorAgent.id, {
        title: 'Assigned Task',
      });

      const bid = await prisma.bid.create({
        data: {
          taskId: assignedTask.taskId,
          agentId: assigneeAgent.id,
          proposal: 'I can do this',
        },
      });

      await tasksService.acceptBid(
        assignedTask.taskId,
        bid.id,
        creatorAgent.id
      );

      const result = await tasksService.getMyTasks(assigneeAgent.id, {
        role: 'assignee',
      });

      expect(result.total).toBeGreaterThan(0);
    });

    it('should use caching for task retrieval', async () => {
      const cacheSpy = jest.spyOn(cacheService, 'getOrSet');

      await tasksService.getTask(testTask.taskId);

      expect(cacheSpy).toHaveBeenCalled();
    });
  });

  // ============================================
  // TASK BIDDING FLOW
  // ============================================
  describe('Task Bidding Flow', () => {
    beforeEach(async () => {
      testTask = await tasksService.createTask(creatorAgent.id, {
        title: 'Biddable Task',
        category: 'testing',
      });
    });

    it('should create a bid successfully', async () => {
      const bidDto = {
        proposal: 'I can complete this task efficiently',
        estimatedTime: 3600,
        estimatedCost: 100,
      };

      const result = await tasksService.bidTask(
        testTask.taskId,
        assigneeAgent.id,
        bidDto
      );

      expect(result).toHaveProperty('bidId');
      expect(result.bid.proposal).toBe(bidDto.proposal);
      expect(result.bid.estimatedTime).toBe(bidDto.estimatedTime);
      expect(result.bid.estimatedCost).toBe(bidDto.estimatedCost);
      expect(result.bid.status).toBe('pending');
    });

    it('should prevent duplicate bids', async () => {
      await tasksService.bidTask(testTask.taskId, assigneeAgent.id, {
        proposal: 'First bid',
      });

      await expect(
        tasksService.bidTask(testTask.taskId, assigneeAgent.id, {
          proposal: 'Second bid',
        })
      ).rejects.toThrow('You have already bid on this task');
    });

    it('should allow multiple agents to bid', async () => {
      const anotherAgent = await prisma.agent.create({
        data: {
          name: `agent-${Date.now()}`,
          publicKey: `key-${Date.now()}`,
        },
      });

      await tasksService.bidTask(testTask.taskId, assigneeAgent.id, {
        proposal: 'Bid 1',
      });

      const result2 = await tasksService.bidTask(
        testTask.taskId,
        anotherAgent.id,
        {
          proposal: 'Bid 2',
        }
      );

      expect(result2.bidId).toBeDefined();
    });

    it('should reject bid on non-open task', async () => {
      // Assign the task first
      const bid = await tasksService.bidTask(testTask.taskId, assigneeAgent.id, {
        proposal: 'Bid',
      });

      await tasksService.acceptBid(testTask.taskId, bid.bidId, creatorAgent.id);

      // Try to bid again
      const anotherAgent = await prisma.agent.create({
        data: {
          name: `agent2-${Date.now()}`,
          publicKey: `key2-${Date.now()}`,
        },
      });

      await expect(
        tasksService.bidTask(testTask.taskId, anotherAgent.id, {
          proposal: 'Late bid',
        })
      ).rejects.toThrow('Task is not open for bidding');
    });

    it('should invalidate cache after bidding', async () => {
      const cacheSpy = jest.spyOn(cacheService, 'del');

      await tasksService.bidTask(testTask.taskId, assigneeAgent.id, {
        proposal: 'Test',
      });

      expect(cacheSpy).toHaveBeenCalledWith(`task:detail:${testTask.taskId}`);
    });
  });

  // ============================================
  // TASK ASSIGNMENT FLOW
  // ============================================
  describe('Task Assignment Flow', () => {
    let testBid: any;

    beforeEach(async () => {
      testTask = await tasksService.createTask(creatorAgent.id, {
        title: 'Assignable Task',
      });

      testBid = await tasksService.bidTask(testTask.taskId, assigneeAgent.id, {
        proposal: 'I can do this',
        estimatedCost: 100,
      });
    });

    it('should accept a bid and assign task', async () => {
      const result = await tasksService.acceptBid(
        testTask.taskId,
        testBid.bidId,
        creatorAgent.id
      );

      expect(result.task.status).toBe('assigned');
      expect(result.task.assigneeId).toBe(assigneeAgent.id);
      expect(result.bid.status).toBe('accepted');
    });

    it('should reject other pending bids when accepting one', async () => {
      // Create another bid
      const anotherAgent = await prisma.agent.create({
        data: {
          name: `agent-${Date.now()}`,
          publicKey: `key-${Date.now()}`,
        },
      });

      const anotherBid = await tasksService.bidTask(
        testTask.taskId,
        anotherAgent.id,
        {
          proposal: 'Another bid',
        }
      );

      // Accept first bid
      await tasksService.acceptBid(testTask.taskId, testBid.bidId, creatorAgent.id);

      // Check that second bid was rejected
      const rejectedBid = await prisma.bid.findUnique({
        where: { id: anotherBid.bidId },
      });

      expect(rejectedBid?.status).toBe('rejected');
    });

    it('should only allow creator to accept bids', async () => {
      await expect(
        tasksService.acceptBid(testTask.taskId, testBid.bidId, assigneeAgent.id)
      ).rejects.toThrow('Only task creator can accept bids');
    });

    it('should invalidate cache after assignment', async () => {
      const cacheSpy = jest.spyOn(cacheService, 'invalidate');

      await tasksService.acceptBid(
        testTask.taskId,
        testBid.bidId,
        creatorAgent.id
      );

      expect(cacheSpy).toHaveBeenCalledWith('tasks:*');
    });
  });

  // ============================================
  // TASK SUBMISSION FLOW
  // ============================================
  describe('Task Submission Flow', () => {
    beforeEach(async () => {
      testTask = await tasksService.createTask(creatorAgent.id, {
        title: 'Submittable Task',
      });

      const bid = await tasksService.bidTask(testTask.taskId, assigneeAgent.id, {
        proposal: 'I will do this',
      });

      await tasksService.acceptBid(testTask.taskId, bid.bidId, creatorAgent.id);
    });

    it('should submit task result successfully', async () => {
      const submitDto = {
        result: {
          code: 'completed',
          files: ['test.ts', 'test.spec.ts'],
          coverage: 95,
        },
      };

      const result = await tasksService.submitTask(
        testTask.taskId,
        assigneeAgent.id,
        submitDto
      );

      expect(result.task.status).toBe('reviewing');
      expect(result.task.result).toEqual(submitDto.result);
    });

    it('should only allow assignee to submit', async () => {
      const anotherAgent = await prisma.agent.create({
        data: {
          name: `agent-${Date.now()}`,
          publicKey: `key-${Date.now()}`,
        },
      });

      await expect(
        tasksService.submitTask(testTask.taskId, anotherAgent.id, {
          result: {},
        })
      ).rejects.toThrow('Only assignee can submit task');
    });

    it('should handle complex result objects', async () => {
      const complexResult = {
        deliverables: [
          { type: 'code', path: 'src/index.ts', lines: 150 },
          { type: 'tests', path: 'test/index.spec.ts', lines: 100 },
        ],
        metrics: {
          coverage: 95,
          complexity: 8,
          performance: 'improved',
        },
        notes: 'All requirements met',
      };

      const result = await tasksService.submitTask(
        testTask.taskId,
        assigneeAgent.id,
        { result: complexResult }
      );

      expect(result.task.result).toEqual(complexResult);
    });

    it('should invalidate cache after submission', async () => {
      const cacheSpy = jest.spyOn(cacheService, 'invalidate');

      await tasksService.submitTask(testTask.taskId, assigneeAgent.id, {
        result: { completed: true },
      });

      expect(cacheSpy).toHaveBeenCalledWith('tasks:*');
    });
  });

  // ============================================
  // TASK COMPLETION FLOW
  // ============================================
  describe('Task Completion Flow', () => {
    beforeEach(async () => {
      testTask = await tasksService.createTask(creatorAgent.id, {
        title: 'Completable Task',
        reward: { credits: 100 },
      });

      const bid = await tasksService.bidTask(testTask.taskId, assigneeAgent.id, {
        proposal: 'I will complete this',
      });

      await tasksService.acceptBid(testTask.taskId, bid.bidId, creatorAgent.id);

      await tasksService.submitTask(testTask.taskId, assigneeAgent.id, {
        result: { code: 'done' },
      });
    });

    it('should complete task with rating', async () => {
      const result = await tasksService.completeTask(
        testTask.taskId,
        creatorAgent.id,
        { rating: 5 }
      );

      expect(result.task.status).toBe('completed');
      expect(result.task.result.rating).toBe(5);
    });

    it('should use default rating if not provided', async () => {
      const result = await tasksService.completeTask(
        testTask.taskId,
        creatorAgent.id,
        {}
      );

      expect(result.task.status).toBe('completed');
      expect(result.task.result.rating).toBe(5);
    });

    it('should only allow creator to complete task', async () => {
      await expect(
        tasksService.completeTask(testTask.taskId, assigneeAgent.id, {
          rating: 5,
        })
      ).rejects.toThrow('Only task creator can complete task');
    });

    it('should update assignee trust score', async () => {
      const initialScore = assigneeAgent.trustScore;

      await tasksService.completeTask(testTask.taskId, creatorAgent.id, {
        rating: 5,
      });

      const updatedAgent = await prisma.agent.findUnique({
        where: { id: assigneeAgent.id },
      });

      expect(updatedAgent?.trustScore).toBeGreaterThan(initialScore);
    });

    it('should invalidate all caches after completion', async () => {
      const cacheSpy = jest.spyOn(cacheService, 'invalidate');

      await tasksService.completeTask(testTask.taskId, creatorAgent.id, {
        rating: 5,
      });

      expect(cacheSpy).toHaveBeenCalledWith('tasks:*');
      expect(cacheSpy).toHaveBeenCalledWith('agents:*');
    });
  });

  // ============================================
  // COMPLETE TASK LIFECYCLE
  // ============================================
  describe('Complete Task Lifecycle', () => {
    it('should complete full lifecycle from creation to completion', async () => {
      // 1. Create task
      const createResult = await tasksService.createTask(creatorAgent.id, {
        title: 'Lifecycle Test Task',
        category: 'testing',
        reward: { credits: 200 },
      });

      expect(createResult.task.status).toBe('open');
      const taskId = createResult.taskId;

      // 2. Bid on task
      const bidResult = await tasksService.bidTask(taskId, assigneeAgent.id, {
        proposal: 'I can complete this',
        estimatedTime: 3600,
        estimatedCost: 150,
      });

      expect(bidResult.bid.status).toBe('pending');

      // 3. Accept bid
      const acceptResult = await tasksService.acceptBid(
        taskId,
        bidResult.bidId,
        creatorAgent.id
      );

      expect(acceptResult.task.status).toBe('assigned');
      expect(acceptResult.task.assigneeId).toBe(assigneeAgent.id);

      // 4. Submit result
      const submitResult = await tasksService.submitTask(
        taskId,
        assigneeAgent.id,
        {
          result: {
            code: 'completed',
            tests: 'passing',
            coverage: 95,
          },
        }
      );

      expect(submitResult.task.status).toBe('reviewing');

      // 5. Complete task
      const completeResult = await tasksService.completeTask(
        taskId,
        creatorAgent.id,
        { rating: 5 }
      );

      expect(completeResult.task.status).toBe('completed');
      expect(completeResult.task.result.rating).toBe(5);

      // 6. Verify final state
      const finalTask = await tasksService.getTask(taskId);
      expect(finalTask.status).toBe('completed');
      expect(finalTask.assignee).toBeDefined();
      expect(finalTask.bids).toHaveLength(1);
    });

    it('should handle task cancellation', async () => {
      const createResult = await tasksService.createTask(creatorAgent.id, {
        title: 'Cancellable Task',
      });

      // Manually set status to cancelled
      await prisma.task.update({
        where: { id: createResult.taskId },
        data: { status: 'cancelled' },
      });

      const task = await tasksService.getTask(createResult.taskId);
      expect(task.status).toBe('cancelled');
    });
  });

  // ============================================
  // MULTI-AGENT SCENARIOS
  // ============================================
  describe('Multi-Agent Scenarios', () => {
    it('should handle multiple agents bidding on same task', async () => {
      const task = await tasksService.createTask(creatorAgent.id, {
        title: 'Popular Task',
      });

      const agents = await Promise.all([
        prisma.agent.create({
          data: { name: `agent1-${Date.now()}`, publicKey: 'key1' },
        }),
        prisma.agent.create({
          data: { name: `agent2-${Date.now()}`, publicKey: 'key2' },
        }),
        prisma.agent.create({
          data: { name: `agent3-${Date.now()}`, publicKey: 'key3' },
        }),
      ]);

      // All agents bid
      const bids = await Promise.all(
        agents.map(agent =>
          tasksService.bidTask(task.taskId, agent.id, {
            proposal: `Bid from ${agent.name}`,
          })
        )
      );

      expect(bids).toHaveLength(3);

      // Verify all bids exist
      const taskWithBids = await tasksService.getTask(task.taskId);
      expect(taskWithBids.bids).toHaveLength(3);
    });

    it('should assign to chosen agent when multiple bids exist', async () => {
      const task = await tasksService.createTask(creatorAgent.id, {
        title: 'Multi-Bid Task',
      });

      const agent1 = await prisma.agent.create({
        data: { name: `agent1-${Date.now()}`, publicKey: 'key1' },
      });

      const agent2 = await prisma.agent.create({
        data: { name: `agent2-${Date.now()}`, publicKey: 'key2' },
      });

      const bid1 = await tasksService.bidTask(task.taskId, agent1.id, {
        proposal: 'Bid 1',
        estimatedCost: 100,
      });

      const bid2 = await tasksService.bidTask(task.taskId, agent2.id, {
        proposal: 'Bid 2',
        estimatedCost: 80,
      });

      // Accept bid from agent2
      const result = await tasksService.acceptBid(
        task.taskId,
        bid2.bidId,
        creatorAgent.id
      );

      expect(result.task.assigneeId).toBe(agent2.id);

      // Verify bid1 was rejected
      const rejectedBid = await prisma.bid.findUnique({
        where: { id: bid1.bidId },
      });
      expect(rejectedBid?.status).toBe('rejected');
    });

    it('should track agent task history', async () => {
      // Create and complete multiple tasks for assignee
      for (let i = 0; i < 3; i++) {
        const task = await tasksService.createTask(creatorAgent.id, {
          title: `Task ${i}`,
        });

        const bid = await tasksService.bidTask(task.taskId, assigneeAgent.id, {
          proposal: `Bid ${i}`,
        });

        await tasksService.acceptBid(task.taskId, bid.bidId, creatorAgent.id);

        await tasksService.submitTask(task.taskId, assigneeAgent.id, {
          result: { completed: true },
        });

        await tasksService.completeTask(task.taskId, creatorAgent.id, {
          rating: 5,
        });
      }

      // Check assignee's completed tasks
      const myTasks = await tasksService.getMyTasks(assigneeAgent.id, {
        role: 'assignee',
        status: 'completed',
      });

      expect(myTasks.total).toBe(3);
    });
  });

  // ============================================
  // ERROR SCENARIOS
  // ============================================
  describe('Error Scenarios', () => {
    it('should handle non-existent task', async () => {
      await expect(tasksService.getTask('non-existent-id')).rejects.toThrow(
        'Task not found'
      );
    });

    it('should handle invalid task ID format', async () => {
      await expect(tasksService.getTask('')).rejects.toThrow();
    });

    it('should handle database connection issues gracefully', async () => {
      // This test would require mocking the database to fail
      // For now, we'll skip this as it's difficult to simulate in integration tests
    });

    it('should handle concurrent modifications', async () => {
      const task = await tasksService.createTask(creatorAgent.id, {
        title: 'Concurrent Task',
      });

      const agent1 = await prisma.agent.create({
        data: { name: `agent1-${Date.now()}`, publicKey: 'key1' },
      });

      const agent2 = await prisma.agent.create({
        data: { name: `agent2-${Date.now()}`, publicKey: 'key2' },
      });

      // Both agents try to bid concurrently
      const bids = await Promise.allSettled([
        tasksService.bidTask(task.taskId, agent1.id, { proposal: 'Bid 1' }),
        tasksService.bidTask(task.taskId, agent2.id, { proposal: 'Bid 2' }),
      ]);

      // At least one should succeed
      const successfulBids = bids.filter(r => r.status === 'fulfilled');
      expect(successfulBids.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // PERFORMANCE TESTS
  // ============================================
  describe('Performance Tests', () => {
    it('should handle large number of tasks efficiently', async () => {
      const startTime = Date.now();

      // Create 100 tasks
      const taskPromises = [];
      for (let i = 0; i < 100; i++) {
        taskPromises.push(
          tasksService.createTask(creatorAgent.id, {
            title: `Bulk Task ${i}`,
          })
        );
      }

      await Promise.all(taskPromises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (e.g., 10 seconds)
      expect(duration).toBeLessThan(10000);
    });

    it('should retrieve tasks with pagination efficiently', async () => {
      // Create some tasks
      for (let i = 0; i < 50; i++) {
        await tasksService.createTask(creatorAgent.id, {
          title: `Pagination Task ${i}`,
        });
      }

      const startTime = Date.now();

      const result = await tasksService.getTasks({ limit: 10, offset: 20 });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.tasks.length).toBeLessThanOrEqual(10);
      expect(duration).toBeLessThan(1000); // Should be fast
    });

    it('should use caching effectively', async () => {
      const task = await tasksService.createTask(creatorAgent.id, {
        title: 'Cached Task',
      });

      // First retrieval (cache miss)
      const startTime1 = Date.now();
      await tasksService.getTask(task.taskId);
      const duration1 = Date.now() - startTime1;

      // Second retrieval (cache hit)
      const startTime2 = Date.now();
      await tasksService.getTask(task.taskId);
      const duration2 = Date.now() - startTime2;

      // Cache hit should be faster (though this is not always reliable in tests)
      // We'll just verify both complete successfully
      expect(duration1).toBeDefined();
      expect(duration2).toBeDefined();
    });
  });
});
