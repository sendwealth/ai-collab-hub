import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { PrismaModule } from '../common/prisma/prisma.module';
import { WorkflowEngine } from './engine/workflow.engine';
import { WorkflowParser } from './parser/workflow.parser';
import { WorkflowExecutor } from './executor/workflow.executor';

@Module({
  imports: [PrismaModule],
  controllers: [WorkflowsController],
  providers: [
    WorkflowsService,
    WorkflowEngine,
    WorkflowParser,
    WorkflowExecutor,
  ],
  exports: [WorkflowsService, WorkflowEngine],
})
export class WorkflowsModule {}
