import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';
import { AgentsService } from '../agents/agents.service';

@Module({
  imports: [PrismaModule],
  controllers: [TeamsController],
  providers: [TeamsService, AgentAuthGuard, AgentsService],
  exports: [TeamsService],
})
export class TeamsModule {}
