import { WebSocketGateway as BaseWebSocketGateway } from './websocket.gateway';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BaseWebSocketGateway],
  exports: [BaseWebSocketGateway],
})
export class WebSocketModule {}
