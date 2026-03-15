import { Module } from '@nestjs/common';
import { MatchingController } from './matching.controller';
import { MatchingService } from './matching.service';
import { PrismaModule } from '../common/prisma/prisma.module';
import { RatingsModule } from '../ratings/ratings.module';
import { SkillsModule } from '../skills/skills.module';

@Module({
  imports: [PrismaModule, RatingsModule, SkillsModule],
  controllers: [MatchingController],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
