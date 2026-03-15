import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { PerformanceInterceptor } from '../common/interceptors';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  controllers: [MonitoringController],
  providers: [PerformanceInterceptor],
})
export class MonitoringModule {}
