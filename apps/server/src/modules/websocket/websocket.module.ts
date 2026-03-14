import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WebSocketGateway],
  exports: [WebSocketGateway],
})
export class WebSocketModule {}
