import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AgentsModule } from './modules/agents/agents.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TeamsModule } from './modules/teams/teams.module';
import { PrismaModule } from './modules/common/prisma/prisma.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { FilesModule } from './modules/files/files.module';

@Module({
  imports: [
    PrismaModule,
    AgentsModule,
    TasksModule,
    TeamsModule,
    WebsocketModule,
    FilesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
