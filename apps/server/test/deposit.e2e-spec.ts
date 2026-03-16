import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Deposit System Integration (e2e)', () => {
  let app: INestApplication;
  const testAgentId = 'deposit-test-agent-001';

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

  describe('Deposit Flow', () => {
    it('1. Should check initial balance', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/deposit/balance/${testAgentId}`)
        .expect(200);

      expect(response.body).toHaveProperty('balance');
      expect(response.body).toHaveProperty('frozen');
      expect(response.body).toHaveProperty('available');
      expect(parseFloat(response.body.balance)).toBeGreaterThanOrEqual(0);
    });

    it('2. Should recharge deposit', async () => {
      const rechargeAmount = 300; // Silver level

      const response = await request(app.getHttpServer())
        .post('/api/v1/deposit/recharge')
        .send({
          agentId: testAgentId,
          amount: rechargeAmount,
          paymentMethod: 'mock',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('transactionId');
      expect(parseFloat(response.body.newBalance)).toBe(rechargeAmount);
    });

    it('3. Should deduct deposit for quality issue', async () => {
      const deductionAmount = 30; // 10% of 300

      const response = await request(app.getHttpServer())
        .post('/api/v1/deposit/deduct')
        .send({
          agentId: testAgentId,
          amount: deductionAmount,
          reason: 'quality_issue',
          severity: 'minor',
          relatedTaskId: 'task-001',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('remainingBalance');
      expect(parseFloat(response.body.remainingBalance)).toBe(270);
    });

    it('4. Should deduct deposit for timeout', async () => {
      const deductionAmount = 54; // 20% of 270

      const response = await request(app.getHttpServer())
        .post('/api/v1/deposit/deduct')
        .send({
          agentId: testAgentId,
          amount: deductionAmount,
          reason: 'timeout',
          relatedTaskId: 'task-002',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(parseFloat(response.body.remainingBalance)).toBe(216);
    });

    it('5. Should view transaction history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/deposit/history/${testAgentId}`)
        .query({ limit: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('transactions');
      expect(response.body.transactions.length).toBeGreaterThan(0);
      expect(response.body.transactions[0]).toHaveProperty('type');
      expect(response.body.transactions[0]).toHaveProperty('amount');
      expect(response.body.transactions[0]).toHaveProperty('createdAt');
    });

    it('6. Should apply for refund', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/deposit/refund')
        .send({
          agentId: testAgentId,
          amount: 100,
          reason: 'account_closure',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('refundId');
      expect(response.body).toHaveProperty('status');
    });

    it('7. Should reject insufficient balance', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/deposit/deduct')
        .send({
          agentId: testAgentId,
          amount: 999999, // More than balance
          reason: 'test',
        })
        .expect(400);
    });

    it('8. Should check deposit requirements for levels', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/deposit/requirements')
        .expect(200);

      expect(response.body).toHaveProperty('bronze');
      expect(response.body).toHaveProperty('silver');
      expect(response.body).toHaveProperty('gold');
      expect(response.body.bronze.amount).toBe(100);
      expect(response.body.silver.amount).toBe(300);
      expect(response.body.gold.amount).toBe(1000);
    });
  });
});
