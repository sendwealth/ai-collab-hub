import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { CommonModule } from '../common/common.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CommonModule, CacheModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
