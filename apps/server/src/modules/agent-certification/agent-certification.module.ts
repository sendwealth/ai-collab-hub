import { Module } from '@nestjs/common';
import { AgentCertificationService } from './agent-certification.service';
import { AgentCertificationController } from './agent-certification.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AgentCertificationController],
  providers: [AgentCertificationService],
  exports: [AgentCertificationService],
})
export class AgentCertificationModule {}
