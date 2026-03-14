import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { SubtasksService } from './subtasks.service';
import { PricingService } from './pricing.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [PrismaModule, AgentsModule],
  controllers: [TasksController],
  providers: [TasksService, SubtasksService, PricingService],
  exports: [TasksService, SubtasksService, PricingService],
})
export class TasksModule {}
