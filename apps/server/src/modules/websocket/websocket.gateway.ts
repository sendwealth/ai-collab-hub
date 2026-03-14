import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

interface ConnectedAgent {
  socketId: string;
  agentId: string;
  agentName: string;
  rooms: Set<string>;
}

@WSGateway({
  cors: {
    origin: '*', // In production, specify allowed origins
    credentials: true,
  },
  namespace: '/notifications',
})
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  private connectedAgents: Map<string, ConnectedAgent> = new Map();
  private agentSockets: Map<string, Set<string>> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    try {
      const apiKey = client.handshake.auth?.apiKey || client.handshake.headers?.['x-api-key'];
      
      if (!apiKey) {
        this.logger.warn(`Client ${client.id} connected without API key`);
        client.disconnect();
        return;
      }

      // Verify API key and get agent
      const agent = await this.prisma.agent.findUnique({
        where: { apiKey },
        select: { id: true, name: true },
      });

      if (!agent) {
        this.logger.warn(`Invalid API key for client ${client.id}`);
        client.disconnect();
        return;
      }

      // Track connected agent
      const agentConnection: ConnectedAgent = {
        socketId: client.id,
        agentId: agent.id,
        agentName: agent.name,
        rooms: new Set(),
      };

      this.connectedAgents.set(client.id, agentConnection);

      // Track all sockets for this agent
      if (!this.agentSockets.has(agent.id)) {
        this.agentSockets.set(agent.id, new Set());
      }
      this.agentSockets.get(agent.id)!.add(client.id);

      // Join agent's personal room
      client.join(`agent:${agent.id}`);

      this.logger.log(`Agent ${agent.name} (${agent.id}) connected with socket ${client.id}`);

      // Send welcome notification
      client.emit('connected', {
        message: 'Successfully connected to notification service',
        agentId: agent.id,
        timestamp: new Date().toISOString(),
      });

      // Send pending notifications
      await this.sendPendingNotifications(client, agent.id);
    } catch (error) {
      this.logger.error(`Connection error: ${(error as Error).message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const agentConnection = this.connectedAgents.get(client.id);
    
    if (agentConnection) {
      // Remove from agent sockets
      const agentSocketSet = this.agentSockets.get(agentConnection.agentId);
      if (agentSocketSet) {
        agentSocketSet.delete(client.id);
        if (agentSocketSet.size === 0) {
          this.agentSockets.delete(agentConnection.agentId);
        }
      }

      this.connectedAgents.delete(client.id);
      this.logger.log(
        `Agent ${agentConnection.agentName} (${agentConnection.agentId}) disconnected`
      );
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    const agentConnection = this.connectedAgents.get(client.id);
    if (!agentConnection) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate room ID format
    const validPrefixes = ['task:', 'project:', 'team:'];
    const isValid = validPrefixes.some(prefix => data.roomId.startsWith(prefix));
    
    if (!isValid) {
      return { success: false, error: 'Invalid room ID format' };
    }

    client.join(data.roomId);
    agentConnection.rooms.add(data.roomId);

    this.logger.log(
      `Agent ${agentConnection.agentName} joined room ${data.roomId}`
    );

    return { success: true, roomId: data.roomId };
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string }
  ) {
    const agentConnection = this.connectedAgents.get(client.id);
    if (!agentConnection) {
      return { success: false, error: 'Not authenticated' };
    }

    client.leave(data.roomId);
    agentConnection.rooms.delete(data.roomId);

    this.logger.log(
      `Agent ${agentConnection.agentName} left room ${data.roomId}`
    );

    return { success: true, roomId: data.roomId };
  }

  // Send notification to specific agent
  async sendNotificationToAgent(agentId: string, notification: any) {
    try {
      // Save notification to database
      const savedNotification = await this.prisma.notification.create({
        data: {
          agentId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          read: false,
        },
      });

      // Emit to all sockets of this agent
      const agentSocketSet = this.agentSockets.get(agentId);
      if (agentSocketSet && agentSocketSet.size > 0) {
        this.server.to(`agent:${agentId}`).emit('notification', {
          id: savedNotification.id,
          ...notification,
          timestamp: savedNotification.createdAt.toISOString(),
        });
        
        this.logger.log(`Notification sent to agent ${agentId}: ${notification.type}`);
      }

      return savedNotification;
    } catch (error) {
      this.logger.error(`Error sending notification: ${(error as Error).message}`);
      throw error;
    }
  }

  // Broadcast to room
  async broadcastToRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
    this.logger.log(`Broadcast ${event} to room ${roomId}`);
  }

  // Task events
  async emitTaskCreated(task: any) {
    // Notify all agents about new task
    this.server.emit('task:created', {
      taskId: task.id,
      title: task.title,
      category: task.category,
      reward: task.reward,
      timestamp: new Date().toISOString(),
    });
  }

  async emitTaskUpdated(task: any, updateType: string) {
    // Notify task room
    this.broadcastToRoom(`task:${task.id}`, 'task:updated', {
      taskId: task.id,
      updateType,
      status: task.status,
      timestamp: new Date().toISOString(),
    });

    // Notify task creator
    if (task.creatorId) {
      await this.sendNotificationToAgent(task.creatorId, {
        type: 'task_update',
        title: 'Task Updated',
        message: `Task "${task.title}" has been updated`,
        data: { taskId: task.id, updateType },
      });
    }

    // Notify assignee if exists
    if (task.assigneeId) {
      await this.sendNotificationToAgent(task.assigneeId, {
        type: 'task_update',
        title: 'Task Updated',
        message: `Task "${task.title}" has been updated`,
        data: { taskId: task.id, updateType },
      });
    }
  }

  async emitBidReceived(task: any, bid: any) {
    // Notify task creator about new bid
    if (task.creatorId) {
      await this.sendNotificationToAgent(task.creatorId, {
        type: 'bid_received',
        title: 'New Bid Received',
        message: `New bid on task "${task.title}"`,
        data: {
          taskId: task.id,
          bidId: bid.id,
          agentId: bid.agentId,
        },
      });
    }
  }

  async emitBidAccepted(task: any, bid: any) {
    // Notify bidder
    await this.sendNotificationToAgent(bid.agentId, {
      type: 'bid_accepted',
      title: 'Bid Accepted',
      message: `Your bid on task "${task.title}" has been accepted!`,
      data: { taskId: task.id, bidId: bid.id },
    });
  }

  async emitTaskCompleted(task: any) {
    // Notify creator
    if (task.creatorId) {
      await this.sendNotificationToAgent(task.creatorId, {
        type: 'task_completed',
        title: 'Task Completed',
        message: `Task "${task.title}" has been completed`,
        data: { taskId: task.id },
      });
    }

    // Notify assignee
    if (task.assigneeId) {
      await this.sendNotificationToAgent(task.assigneeId, {
        type: 'task_completed',
        title: 'Task Completed',
        message: `Task "${task.title}" marked as completed`,
        data: { taskId: task.id, reward: task.reward },
      });
    }
  }

  // Get notification history
  async getNotificationHistory(
    agentId: string,
    options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
  ) {
    const { page = 1, limit = 20, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const where: any = { agentId };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Mark notification as read
  async markAsRead(notificationId: string, agentId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, agentId },
      data: { read: true },
    });
  }

  // Mark all as read
  async markAllAsRead(agentId: string) {
    return this.prisma.notification.updateMany({
      where: { agentId, read: false },
      data: { read: true },
    });
  }

  // Send pending notifications on connect
  private async sendPendingNotifications(client: Socket, agentId: string) {
    try {
      const unreadNotifications = await this.prisma.notification.findMany({
        where: { agentId, read: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      if (unreadNotifications.length > 0) {
        client.emit('notifications:pending', {
          count: unreadNotifications.length,
          notifications: unreadNotifications,
        });

        this.logger.log(
          `Sent ${unreadNotifications.length} pending notifications to agent ${agentId}`
        );
      }
    } catch (error) {
      this.logger.error(`Error sending pending notifications: ${(error as Error).message}`);
    }
  }

  // Get online agents
  getOnlineAgents(): string[] {
    return Array.from(this.agentSockets.keys());
  }

  // Check if agent is online
  isAgentOnline(agentId: string): boolean {
    const sockets = this.agentSockets.get(agentId);
    return sockets !== undefined && sockets.size > 0;
  }

  // Get connection stats
  getConnectionStats() {
    return {
      totalConnections: this.connectedAgents.size,
      uniqueAgents: this.agentSockets.size,
      onlineAgents: this.getOnlineAgents(),
    };
  }
}
