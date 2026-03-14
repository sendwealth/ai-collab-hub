import { Module } from '@nestjs/common';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';

@Module({
  imports: [PrismaModule],
  controllers: [AgentsController],
  providers: [AgentsService, AgentAuthGuard],
  exports: [AgentsService, AgentAuthGuard],
})
export class AgentsModule {}
