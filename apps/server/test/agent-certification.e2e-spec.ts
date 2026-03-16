import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Agent Certification Integration (e2e)', () => {
  let app: INestApplication;
  const testAgentId = 'cert-test-agent-001';

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

  describe('Certification Flow', () => {
    it('1. Should check certification status', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/agent-certification/status/${testAgentId}`)
        .expect(200);

      expect(response.body).toHaveProperty('certified');
      expect(response.body).toHaveProperty('level');
      expect(response.body).toHaveProperty('requirements');
    });

    it('2. Should apply for certification', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/agent-certification/apply')
        .send({
          agentId: testAgentId,
          testScore: 75,
        })
        .expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('level');
      expect(['bronze', 'silver', 'gold']).toContain(response.body.level);
      expect(response.body).toHaveProperty('badgeUrl');
    });

    it('3. Should get certification badge', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/agent-certification/badge/${testAgentId}`)
        .expect(200);

      expect(response.body).toHaveProperty('badgeUrl');
      expect(response.body).toHaveProperty('level');
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('validUntil');
    });

    it('4. Should handle insufficient requirements', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/agent-certification/apply')
        .send({
          agentId: 'new-agent-001',
          testScore: 85, // Gold level score
          // But missing task count and rating
        })
        .expect(201);

      // Should downgrade to appropriate level
      expect(response.body.level).not.toBe('gold');
    });

    it('5. Should list all certification levels', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/agent-certification/levels')
        .expect(200);

      expect(response.body).toHaveProperty('levels');
      expect(response.body.levels).toHaveLength(3);
      expect(response.body.levels[0]).toHaveProperty('name');
      expect(response.body.levels[0]).toHaveProperty('requirements');
    });
  });
});
