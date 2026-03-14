import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
// import { PrismaService } from './../src/modules/common/prisma/prisma.service';

describe('Health Check (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

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
