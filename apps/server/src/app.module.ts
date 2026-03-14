import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AgentsModule } from './modules/agents/agents.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { PrismaModule } from './modules/common/prisma/prisma.module';
import { WebsocketModule } from './modules/websocket/websocket.module';

@Module({
  imports: [
    PrismaModule,
    AgentsModule,
    TasksModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
