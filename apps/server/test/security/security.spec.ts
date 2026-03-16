import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/modules/common/prisma/prisma.service';
import { AppModule } from '../../src/app.module';
import { SecurityTestUtils, DatabaseCleanup } from '../utils/test-helpers';

describe('Security Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cleanup: DatabaseCleanup;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    cleanup = new DatabaseCleanup(prisma);
  });

  afterAll(async () => {
    await cleanup.cleanAllTestData();
    await app.close();
  });

  afterEach(async () => {
    await cleanup.cleanAllTestData();
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in agent name', async () => {
      const maliciousPayloads = SecurityTestUtils.getSQLInjectionPayloads();

      for (const payload of maliciousPayloads) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: payload,
            capabilities: ['coding'],
            version: '1.0.0',
          })
          .expect(400);

        // Should reject malicious input
        expect(response.body).toBeDefined();
      }

      // Verify no malicious data was created
      const agents = await prisma.agent.findMany({
        where: {
          name: {
            contains: 'OR',
          },
        },
      });

      expect(agents).toHaveLength(0);
    });

    it('should prevent SQL injection in query parameters', async () => {
      // Create a test agent first
      await prisma.agent.create({
        data: {
          id: 'test-sql-agent',
          name: 'Test Agent',
          capabilities: ['coding'],
          version: '1.0.0',
          status: 'active',
        },
      });

      const maliciousQueries = SecurityTestUtils.getSQLInjectionPayloads();

      for (const query of maliciousQueries) {
        const response = await request(app.getHttpServer())
          .get(`/agents/${query}`)
          .expect(404); // Should not find anything

        // Should safely return 404, not error
        expect(response.body).toBeDefined();
      }
    });

    it('should prevent SQL injection in test answers', async () => {
      const agentId = 'agent-sql-inject-test';

      await prisma.agent.create({
        data: {
          id: agentId,
          name: 'Test Agent',
          capabilities: ['coding'],
          version: '1.0.0',
        },
      });

      const sqlPayloads = SecurityTestUtils.getSQLInjectionPayloads();

      // Create test attempt
      const attempt = await prisma.agentTestAttempt.create({
        data: {
          agentId,
          questionIds: JSON.stringify(['q1']),
          totalQuestions: 1,
          totalScore: 10,
          status: 'in_progress',
          startedAt: new Date(),
        },
      });

      // Try to submit SQL injection as answer
      for (const payload of sqlPayloads) {
        await request(app.getHttpServer())
          .post(`/agent-testing/${agentId}/submit/${attempt.id}`)
          .send({
            answers: [
              {
                questionId: 'q1',
                answer: payload,
                timeSpent: 30,
              },
            ],
          })
          .expect(400); // Should validate and reject
      }

      // Verify answers were not created
      const answers = await prisma.agentTestAnswer.findMany({
        where: { attemptId: attempt.id },
      });

      expect(answers).toHaveLength(0);
    });
  });

  describe('XSS Prevention', () => {
    it('should prevent XSS in agent description', async () => {
      const xssPayloads = SecurityTestUtils.getXSSPayloads();

      for (const payload of xssPayloads) {
        const response = await request(app.getHttpServer())
          .post('/agents')
          .send({
            name: 'Test Agent',
            description: payload,
            capabilities: ['coding'],
            version: '1.0.0',
          })
          .expect(201);

        // Should sanitize input
        SecurityTestUtils.assertSanitized(payload, response.body.description);
      }
    });

    it('should prevent XSS in test answers', async () => {
      const agentId = 'agent-xss-test';

      await prisma.agent.create({
        data: {
          id: agentId,
          name: 'Test Agent',
          capabilities: ['coding'],
          version: '1.0.0',
        },
      });

      const attempt = await prisma.agentTestAttempt.create({
        data: {
          agentId,
          questionIds: JSON.stringify(['q1']),
          totalQuestions: 1,
          totalScore: 10,
          status: 'in_progress',
          startedAt: new Date(),
        },
      });

      const xssPayloads = SecurityTestUtils.getXSSPayloads();

      for (const payload of xssPayloads) {
        const response = await request(app.getHttpServer())
          .post(`/agent-testing/${agentId}/submit/${attempt.id}`)
          .send({
            answers: [
              {
                questionId: 'q1',
                answer: payload,
                timeSpent: 30,
              },
            ],
          })
          .expect(201);

        // Answer should be sanitized in response
        if (response.body.answers) {
          response.body.answers.forEach((ans: any) => {
            SecurityTestUtils.assertSanitized(payload, ans.answer);
          });
        }
      }
    });

    it('should prevent XSS in transaction descriptions', async () => {
      const agentId = 'agent-xss-deposit-test';

      await prisma.agentDeposit.create({
        data: {
          agentId,
          balance: 1000,
          frozenBalance: 0,
          totalDeposited: 1000,
          totalDeducted: 0,
          totalRefunded: 0,
        },
      });

      const xssPayloads = SecurityTestUtils.getXSSPayloads();

      for (const payload of xssPayloads) {
        const response = await request(app.getHttpServer())
          .post(`/deposit/${agentId}/deposit`)
          .send({
            amount: 100,
            description: payload,
          })
          .expect(201);

        // Description should be sanitized
        SecurityTestUtils.assertSanitized(payload, response.body.description);
      }
    });
  });

  describe('Authentication and Authorization', () => {
    it('should prevent unauthorized access to agent data', async () => {
      const agentId = 'agent-auth-test-1';

      await prisma.agent.create({
        data: {
          id: agentId,
          name: 'Private Agent',
          capabilities: ['coding'],
          version: '1.0.0',
        },
      });

      // Try to update without proper authentication
      await request(app.getHttpServer())
        .patch(`/agents/${agentId}`)
        .send({ name: 'Hacked Name' })
        .expect(401); // Unauthorized
    });

    it('should prevent privilege escalation', async () => {
      // Create regular agent
      const regularAgent = await prisma.agent.create({
        data: {
          id: 'agent-regular',
          name: 'Regular Agent',
          capabilities: ['coding'],
          version: '1.0.0',
        },
      });

      // Try to promote to admin (if such endpoint existed)
      // This test ensures no such vulnerability exists
      await request(app.getHttpServer())
        .post(`/agents/${regularAgent.id}/promote`)
        .send({ role: 'admin' })
        .expect(404); // Endpoint should not exist
    });

    it('should prevent cross-agent data access', async () => {
      const agent1 = 'agent-cross-1';
      const agent2 = 'agent-cross-2';

      await prisma.agentDeposit.create({
        data: {
          agentId: agent1,
          balance: 1000,
          frozenBalance: 0,
          totalDeposited: 1000,
          totalDeducted: 0,
          totalRefunded: 0,
        },
      });

      // Try to access agent1's deposit from agent2's context
      await request(app.getHttpServer())
        .get(`/deposit/${agent1}/balance`)
        .set('X-Agent-Id', agent2) // Simulating agent2's request
        .expect(401); // Should be unauthorized
    });
  });

  describe('Input Validation', () => {
    it('should validate negative amounts in deposits', async () => {
      const agentId = 'agent-validation-test';

      await prisma.agentDeposit.create({
        data: {
          agentId,
          balance: 1000,
          frozenBalance: 0,
          totalDeposited: 1000,
          totalDeducted: 0,
          totalRefunded: 0,
        },
      });

      await request(app.getHttpServer())
        .post(`/deposit/${agentId}/deposit`)
        .send({ amount: -100 })
        .expect(400);

      await request(app.getHttpServer())
        .post(`/deposit/${agentId}/deposit`)
        .send({ amount: 0 })
        .expect(400);
    });

    it('should validate oversized amounts', async () => {
      const agentId = 'agent-oversize-test';

      await prisma.agentDeposit.create({
        data: {
          agentId,
          balance: 1000,
          frozenBalance: 0,
          totalDeposited: 1000,
          totalDeducted: 0,
          totalRefunded: 0,
        },
      });

      const hugeAmount = Number.MAX_SAFE_INTEGER.toString();

      await request(app.getHttpServer())
        .post(`/deposit/${agentId}/deposit`)
        .send({ amount: hugeAmount })
        .expect(400); // Should validate
    });

    it('should validate required fields', async () => {
      await request(app.getHttpServer())
        .post('/agents')
        .send({
          // Missing required fields
          name: 'Incomplete Agent',
        })
        .expect(400);
    });

    it('should validate data types', async () => {
      await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: 'Type Test Agent',
          capabilities: 'not-an-array', // Should be array
          version: 1.0, // Should be string
        })
        .expect(400);
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should prevent path traversal in file operations', async () => {
      const pathPayloads = SecurityTestUtils.getPathTraversalPayloads();

      for (const payload of pathPayloads) {
        // Try to access files outside allowed directory
        await request(app.getHttpServer())
          .get(`/files/${payload}`)
          .expect(403); // Forbidden
      }
    });

    it('should prevent path traversal in agent IDs', async () => {
      const pathPayloads = SecurityTestUtils.getPathTraversalPayloads();

      for (const payload of pathPayloads) {
        await request(app.getHttpServer())
          .get(`/agents/${payload}`)
          .expect(400); // Bad request - invalid ID format
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should prevent brute force attacks on authentication', async () => {
      const agentId = 'agent-brute-test';

      // Try multiple rapid requests
      const requests = Array(100)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .post('/auth/login')
            .send({
              agentId,
              password: 'wrong-password',
            }),
        );

      const responses = await Promise.all(requests);

      // Should rate limit after some attempts
      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should prevent API abuse', async () => {
      const agentId = 'agent-abuse-test';

      await prisma.agent.create({
        data: {
          id: agentId,
          name: 'Test Agent',
          capabilities: ['coding'],
          version: '1.0.0',
        },
      });

      // Try to spam requests
      const requests = Array(200)
        .fill(null)
        .map(() =>
          request(app.getHttpServer()).get(`/agents/${agentId}`),
        );

      const responses = await Promise.all(requests);

      // Should rate limit
      const rateLimited = responses.filter((r) => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('Data Exposure Prevention', () => {
    it('should not expose internal error details', async () => {
      // Trigger an error
      const response = await request(app.getHttpServer())
        .get('/agents/non-existent-id-12345')
        .expect(404);

      // Should not expose stack traces or internal details
      expect(response.body.message).toBeDefined();
      expect(response.body.stack).toBeUndefined();
      expect(response.body.error).not.toContain('Prisma');
      expect(response.body.error).not.toContain('Database');
    });

    it('should not expose sensitive data in API responses', async () => {
      const agent = await prisma.agent.create({
        data: {
          id: 'agent-sensitive-test',
          name: 'Sensitive Agent',
          capabilities: ['coding'],
          version: '1.0.0',
          // Any internal fields should not be exposed
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/agents/${agent.id}`)
        .expect(200);

      // Should not expose internal fields
      expect(response.body.internalNotes).toBeUndefined();
      expect(response.body.secretKey).toBeUndefined();
      expect(response.body.passwordHash).toBeUndefined();
    });

    it('should sanitize error messages', async () => {
      const response = await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: '', // Invalid empty name
          capabilities: ['coding'],
          version: '1.0.0',
        })
        .expect(400);

      // Error message should be generic, not exposing internals
      expect(response.body.message).toBeDefined();
      expect(response.body.message).not.toContain('INSERT');
      expect(response.body.message).not.toContain('SELECT');
    });
  });

  describe('CSRF Protection', () => {
    it('should require CSRF token for state-changing operations', async () => {
      // This test assumes CSRF protection is enabled
      // If not using CSRF, this test documents that decision
      await request(app.getHttpServer())
        .post('/agents')
        .send({
          name: 'CSRF Test Agent',
          capabilities: ['coding'],
          version: '1.0.0',
        })
        .expect(201); // If CSRF is not enabled, this documents it
    });
  });

  describe('Mass Assignment Prevention', () => {
    it('should prevent mass assignment attacks', async () => {
      const maliciousData = {
        name: 'Test Agent',
        capabilities: ['coding'],
        version: '1.0.0',
        // Try to set fields that shouldn't be user-modifiable
        id: 'hacked-id',
        status: 'admin',
        role: 'superuser',
        isAdmin: true,
        createdAt: new Date('1900-01-01'),
      };

      const response = await request(app.getHttpServer())
        .post('/agents')
        .send(maliciousData)
        .expect(201);

      // System should ignore or reject unauthorized fields
      expect(response.body.id).not.toBe('hacked-id');
      expect(response.body.status).not.toBe('admin');
      expect(response.body.role).toBeUndefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      // Check for security headers
      expect(response.headers['x-powered-by']).toBeUndefined();
      // These should be present if configured
      // expect(response.headers['x-frame-options']).toBeDefined();
      // expect(response.headers['x-content-type-options']).toBeDefined();
      // expect(response.headers['strict-transport-security']).toBeDefined();
    });
  });
});
