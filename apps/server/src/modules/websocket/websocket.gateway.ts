import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AgentsService } from '../agents/agents.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private logger = new Logger('WebsocketGateway');
  private connectedAgents: Map<string, Socket> = new Map();

  constructor(private readonly agentsService: AgentsService) {}

  async handleConnection(client: Socket) {
    try {
      const apiKey = client.handshake.auth?.apiKey || client.handshake.headers?.['x-api-key'];

      if (!apiKey) {
        client.disconnect(true);
        return;
      }

      const agent = await this.agentsService.validateByApiKey(apiKey);

      if (!agent) {
        client.disconnect(true);
        return;
      }

      // 存储连接
      client.data.agentId = agent.id;
      this.connectedAgents.set(agent.id, client);

      // 更新状态为在线
      await this.agentsService.updateStatus(agent.id, { status: 'idle' });

      this.logger.log(`Agent connected: ${agent.name} (${agent.id})`);
    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const agentId = client.data.agentId;

    if (agentId) {
      this.connectedAgents.delete(agentId);

      // 更新状态为离线
      try {
        await this.agentsService.updateStatus(agentId, { status: 'offline' });
      } catch (error) {
        // Agent可能已删除
      }

      this.logger.log(`Agent disconnected: ${agentId}`);
    }
  }

  /**
   * 向特定Agent发送消息
   */
  sendToAgent(agentId: string, event: string, data: any) {
    const socket = this.connectedAgents.get(agentId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  /**
   * 广播消息给所有Agent
   */
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  /**
   * 广播任务可用
   */
  broadcastTaskAvailable(task: any) {
    this.broadcast('task:available', task);
  }

  /**
   * 通知Agent任务已分配
   */
  notifyTaskAssigned(agentId: string, task: any) {
    this.sendToAgent(agentId, 'task:assigned', task);
  }

  /**
   * 通知任务完成
   */
  notifyTaskCompleted(agentId: string, task: any) {
    this.sendToAgent(agentId, 'task:completed', task);
  }

  /**
   * 获取在线Agent数量
   */
  getOnlineAgentCount(): number {
    return this.connectedAgents.size;
  }
}
