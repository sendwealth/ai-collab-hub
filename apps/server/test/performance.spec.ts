import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Performance Tests (e2e)', () => {
  let app: INestApplication;

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

  describe('Response Time Tests', () => {
    it('GET /api/v1/agents should respond within 100ms', async () => {
      const start = Date.now();
      
      await request(app.getHttpServer())
        .get('/api/v1/agents')
        .expect(200);
      
      const duration = Date.now() - start;
      console.log(`GET /agents: ${duration}ms`);
      
      expect(duration).toBeLessThan(100);
    });

    it('GET /api/v1/tasks should respond within 100ms', async () => {
      const start = Date.now();
      
      await request(app.getHttpServer())
        .get('/api/v1/tasks')
        .expect(200);
      
      const duration = Date.now() - start;
      console.log(`GET /tasks: ${duration}ms`);
      
      expect(duration).toBeLessThan(100);
    });

    it('Cached requests should be faster than 50ms', async () => {
      // First request (cache miss)
      const firstStart = Date.now();
      await request(app.getHttpServer())
        .get('/api/v1/agents')
        .expect(200);
      const firstDuration = Date.now() - firstStart;
      
      // Second request (cache hit)
      const secondStart = Date.now();
      await request(app.getHttpServer())
        .get('/api/v1/agents')
        .expect(200);
      const secondDuration = Date.now() - secondStart;
      
      console.log(`First request: ${firstDuration}ms, Cached request: ${secondDuration}ms`);
      
      // Cached request should be significantly faster
      expect(secondDuration).toBeLessThan(firstDuration);
      expect(secondDuration).toBeLessThan(50);
    });
  });

  describe('Concurrent Load Tests', () => {
    it('should handle 50 concurrent requests to /agents', async () => {
      const concurrentRequests = 50;
      const requests = Array(concurrentRequests)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/api/v1/agents')
            .expect(200)
        );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      console.log(`${concurrentRequests} concurrent requests completed in ${duration}ms`);
      console.log(`Average per request: ${(duration / concurrentRequests).toFixed(2)}ms`);

      // All requests should succeed
      expect(responses.every(r => r.status === 200)).toBe(true);
      
      // Total time should be reasonable (< 3 seconds for 50 requests)
      expect(duration).toBeLessThan(3000);
    });

    it('should handle 100 concurrent requests to /tasks', async () => {
      const concurrentRequests = 100;
      const requests = Array(concurrentRequests)
        .fill(null)
        .map(() =>
          request(app.getHttpServer())
            .get('/api/v1/tasks')
            .expect(200)
        );

      const start = Date.now();
      const responses = await Promise.all(requests);
      const duration = Date.now() - start;

      console.log(`${concurrentRequests} concurrent requests completed in ${duration}ms`);
      console.log(`Average per request: ${(duration / concurrentRequests).toFixed(2)}ms`);

      expect(responses.every(r => r.status === 200)).toBe(true);
      expect(duration).toBeLessThan(5000); // < 5 seconds
    });
  });

  describe('Response Compression', () => {
    it('should compress large responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/tasks?limit=100')
        .set('Accept-Encoding', 'gzip, deflate')
        .expect(200);

      // Check if response is compressed (content-encoding header)
      const encoding = response.headers['content-encoding'];
      console.log('Content-Encoding:', encoding);
      
      // If response is large enough, it should be compressed
      if (response.body && JSON.stringify(response.body).length > 1024) {
        expect(encoding).toBeDefined();
      }
    });
  });

  describe('Cache Performance', () => {
    it('should achieve >80% cache hit rate after warmup', async () => {
      // Warmup - make several requests to populate cache
      const warmupRequests = 10;
      for (let i = 0; i < warmupRequests; i++) {
        await request(app.getHttpServer())
          .get('/api/v1/agents')
          .expect(200);
      }

      // Test - make multiple requests and check if cached
      const testRequests = 20;
      const durations: number[] = [];

      for (let i = 0; i < testRequests; i++) {
        const start = Date.now();
        await request(app.getHttpServer())
          .get('/api/v1/agents')
          .expect(200);
        durations.push(Date.now() - start);
      }

      // Calculate average
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      console.log(`Average duration after warmup: ${avgDuration.toFixed(2)}ms`);

      // Most requests should be fast (< 50ms) indicating cache hits
      const fastRequests = durations.filter(d => d < 50).length;
      const hitRate = (fastRequests / testRequests) * 100;
      
      console.log(`Cache hit rate: ${hitRate.toFixed(2)}%`);
      
      expect(hitRate).toBeGreaterThan(80);
    });
  });
});
