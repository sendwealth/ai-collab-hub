import { Module } from '@nestjs/common';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { CommonModule } from '../common/common.module';
import { TasksModule } from '../tasks/tasks.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CommonModule, TasksModule, CacheModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
