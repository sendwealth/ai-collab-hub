import { Module } from '@nestjs/common';
import { BatchController } from './batch.controller';
import { AgentsModule } from '../agents/agents.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [AgentsModule, TasksModule],
  controllers: [BatchController],
})
export class BatchModule {}
