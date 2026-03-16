import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { PerformanceInterceptor } from './modules/common/interceptors';
import { GlobalExceptionFilter } from './modules/common/filters/global-exception.filter';
import { TransformInterceptor } from './modules/common/interceptors/transform.interceptor';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // 启用响应压缩 - 性能优化
  app.use(compression({
    threshold: 1024, // 只压缩 >1KB 的响应
    level: 6, // 压缩级别 (0-9)
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }));

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 全局性能监控拦截器
  const performanceInterceptor = app.get(PerformanceInterceptor);
  app.useGlobalInterceptors(
    performanceInterceptor,
    new TransformInterceptor(),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // API前缀
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Server running on http://localhost:${port}`);
  logger.log(`📚 API: http://localhost:${port}/api/v1`);
  logger.log(`⚡ Performance optimizations enabled: compression, caching, monitoring`);
}

bootstrap();
