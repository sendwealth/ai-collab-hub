import { Module } from '@nestjs/common';
import { AgentTestingService } from './agent-testing.service';
import { AgentTestingController } from './agent-testing.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AgentTestingController],
  providers: [AgentTestingService],
  exports: [AgentTestingService],
})
export class AgentTestingModule {}
