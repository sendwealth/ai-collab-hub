import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AgentsModule } from './modules/agents/agents.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TeamsModule } from './modules/teams/teams.module';
import { CreditsModule } from './modules/credits/credits.module';
import { PrismaModule } from './modules/common/prisma/prisma.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { FilesModule } from './modules/files/files.module';
import { CacheModule } from './modules/cache';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { PerformanceInterceptor } from './modules/common/interceptors';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { BatchModule } from './modules/batch/batch.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SearchModule } from './modules/search/search.module';
import { TemplatesModule } from './modules/templates/templates.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    CacheModule,
    PrismaModule,
    AgentsModule,
    TasksModule,
    TeamsModule,
    CreditsModule,
    WebSocketModule,
    FilesModule,
    RecommendationsModule,
    MonitoringModule,
    BatchModule,
    WorkflowsModule,
    AnalyticsModule,
    SearchModule,
    TemplatesModule,
  ],
  controllers: [AppController],
  providers: [PerformanceInterceptor],
})
export class AppModule {}
