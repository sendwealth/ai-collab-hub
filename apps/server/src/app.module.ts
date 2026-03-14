import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from './modules/agents/agents.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { PrismaModule } from './modules/common/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AgentsModule,
    TasksModule,
    WebsocketModule,
  ],
})
export class AppModule {}
