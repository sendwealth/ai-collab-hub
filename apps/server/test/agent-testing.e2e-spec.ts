import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Agent Testing Integration (e2e)', () => {
  let app: INestApplication;
  let agentId: string;
  let sessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Agent Testing Flow', () => {
    it('1. Should start a new test session', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/agent-testing/start')
        .send({ agentId: 'test-agent-001' })
        .expect(201);

      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('questions');
      expect(response.body.questions).toHaveLength(10);
      expect(response.body.timeLimit).toBe(1800); // 30 minutes

      sessionId = response.body.sessionId;
      agentId = 'test-agent-001';
    });

    it('2. Should get test questions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/agent-testing/questions')
        .expect(200);

      expect(response.body).toHaveProperty('questions');
      expect(response.body.questions.length).toBeGreaterThan(0);
      expect(response.body.questions[0]).toHaveProperty('id');
      expect(response.body.questions[0]).toHaveProperty('category');
      expect(response.body.questions[0]).toHaveProperty('question');
    });

    it('3. Should submit answers and get score', async () => {
      // Get questions first
      const questionsRes = await request(app.getHttpServer())
        .get('/api/v1/agent-testing/questions');

      const questions = questionsRes.body.questions;
      const answers = questions.map(q => ({
        questionId: q.id,
        answer: q.options[0], // Select first option for testing
      }));

      const response = await request(app.getHttpServer())
        .post('/api/v1/agent-testing/submit')
        .send({
          sessionId,
          answers,
        })
        .expect(201);

      expect(response.body).toHaveProperty('score');
      expect(response.body.score).toBeGreaterThanOrEqual(0);
      expect(response.body.score).toBeLessThanOrEqual(100);
      expect(response.body).toHaveProperty('level');
      expect(['bronze', 'silver', 'gold']).toContain(response.body.level);
      expect(response.body).toHaveProperty('details');
    });

    it('4. Should get test result', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/agent-testing/result/${sessionId}`)
        .expect(200);

      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('level');
      expect(response.body).toHaveProperty('completedAt');
      expect(response.body).toHaveProperty('breakdown');
    });

    it('5. Should handle invalid session', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/agent-testing/result/invalid-session-id')
        .expect(404);
    });
  });
});
