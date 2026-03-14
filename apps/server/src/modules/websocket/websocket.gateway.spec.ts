import { Test, TestingModule } from '@nestjs/testing';
import { WebSocketGateway } from './websocket.gateway';
import { PrismaService } from '../../prisma/prisma.service';
import { Socket } from 'socket.io';

describe('WebSocketGateway', () => {
  let gateway: WebSocketGateway;
  let prisma: PrismaService;

  const mockPrismaService = {
    agent: {
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockSocket = {
    id: 'socket-id',
    handshake: {
      auth: { apiKey: 'sk_agent_test' },
      headers: {},
    },
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebSocketGateway,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    gateway = module.get<WebSocketGateway>(WebSocketGateway);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should accept connection with valid API key', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.join).toHaveBeenCalledWith('agent:agent-id');
      expect(mockSocket.emit).toHaveBeenCalledWith('connected', expect.any(Object));
    });

    it('should reject connection without API key', async () => {
      const invalidSocket = {
        ...mockSocket,
        handshake: { auth: {}, headers: {} },
      };

      await gateway.handleConnection(invalidSocket as any);

      expect(invalidSocket.disconnect).toHaveBeenCalled();
    });

    it('should reject connection with invalid API key', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should send pending notifications on connect', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
      };

      const mockNotifications = [
        { id: 'notif-1', type: 'test', title: 'Test', message: 'Message' },
      ];

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue(mockNotifications);

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'notifications:pending',
        expect.objectContaining({
          count: 1,
        })
      );
    });
  });

  describe('handleDisconnect', () => {
    it('should clean up agent connection', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      // Connect first
      await gateway.handleConnection(mockSocket as any);

      // Then disconnect
      await gateway.handleDisconnect(mockSocket as any);

      // Verify connection is cleaned up
      const stats = gateway.getConnectionStats();
      expect(stats.totalConnections).toBe(0);
    });
  });

  describe('handleJoinRoom', () => {
    it('should join valid room', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      await gateway.handleConnection(mockSocket as any);

      const result = await gateway.handleJoinRoom(mockSocket as any, {
        roomId: 'task:task-id',
      });

      expect(result.success).toBe(true);
      expect(mockSocket.join).toHaveBeenCalledWith('task:task-id');
    });

    it('should reject invalid room ID', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      await gateway.handleConnection(mockSocket as any);

      const result = await gateway.handleJoinRoom(mockSocket as any, {
        roomId: 'invalid-room',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('handleLeaveRoom', () => {
    it('should leave room', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      await gateway.handleConnection(mockSocket as any);
      await gateway.handleJoinRoom(mockSocket as any, {
        roomId: 'task:task-id',
      });

      const result = await gateway.handleLeaveRoom(mockSocket as any, {
        roomId: 'task:task-id',
      });

      expect(result.success).toBe(true);
      expect(mockSocket.leave).toHaveBeenCalledWith('task:task-id');
    });
  });

  describe('sendNotificationToAgent', () => {
    it('should send notification to online agent', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-id',
        type: 'test',
        title: 'Test',
        message: 'Message',
        createdAt: new Date(),
      });

      // Connect agent
      await gateway.handleConnection(mockSocket as any);

      // Send notification
      const result = await gateway.sendNotificationToAgent('agent-id', {
        type: 'test',
        title: 'Test',
        message: 'Message',
      });

      expect(result).toHaveProperty('id');
      expect(mockSocket.emit).toHaveBeenCalledWith(
        'notification',
        expect.objectContaining({
          type: 'test',
        })
      );
    });

    it('should save notification to database', async () => {
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-id',
        type: 'test',
        title: 'Test',
        message: 'Message',
      });

      await gateway.sendNotificationToAgent('agent-id', {
        type: 'test',
        title: 'Test',
        message: 'Message',
      });

      expect(mockPrismaService.notification.create).toHaveBeenCalled();
    });
  });

  describe('Task Events', () => {
    beforeEach(async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-id',
      });

      await gateway.handleConnection(mockSocket as any);
    });

    it('should emit task created event', async () => {
      const task = {
        id: 'task-id',
        title: 'Test Task',
        category: 'testing',
        reward: { credits: 100 },
      };

      await gateway.emitTaskCreated(task);

      expect(mockSocket.emit).toHaveBeenCalledWith(
        'task:created',
        expect.objectContaining({
          taskId: 'task-id',
        })
      );
    });

    it('should emit bid received event', async () => {
      const task = {
        id: 'task-id',
        title: 'Test Task',
        creatorId: 'creator-id',
      };

      const bid = {
        id: 'bid-id',
        agentId: 'agent-id',
      };

      await gateway.emitBidReceived(task, bid);

      expect(mockPrismaService.notification.create).toHaveBeenCalled();
    });

    it('should emit bid accepted event', async () => {
      const task = {
        id: 'task-id',
        title: 'Test Task',
      };

      const bid = {
        id: 'bid-id',
        agentId: 'agent-id',
      };

      await gateway.emitBidAccepted(task, bid);

      expect(mockPrismaService.notification.create).toHaveBeenCalled();
    });

    it('should emit task completed event', async () => {
      const task = {
        id: 'task-id',
        title: 'Test Task',
        creatorId: 'creator-id',
        assigneeId: 'agent-id',
        reward: { credits: 100 },
      };

      await gateway.emitTaskCompleted(task);

      expect(mockPrismaService.notification.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('Notification History', () => {
    it('should get notification history', async () => {
      const mockNotifications = [
        { id: 'notif-1', type: 'test' },
        { id: 'notif-2', type: 'test' },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(mockNotifications);
      mockPrismaService.notification.count.mockResolvedValue(2);

      const result = await gateway.getNotificationHistory('agent-id');

      expect(result.notifications).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter unread notifications', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.count.mockResolvedValue(0);

      await gateway.getNotificationHistory('agent-id', { unreadOnly: true });

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { agentId: 'agent-id', read: false },
        })
      );
    });

    it('should support pagination', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.count.mockResolvedValue(100);

      const result = await gateway.getNotificationHistory('agent-id', {
        page: 2,
        limit: 10,
      });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(10);
    });
  });

  describe('Mark as Read', () => {
    it('should mark notification as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 1 });

      await gateway.markAsRead('notif-id', 'agent-id');

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { id: 'notif-id', agentId: 'agent-id' },
        data: { read: true },
      });
    });

    it('should mark all notifications as read', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      await gateway.markAllAsRead('agent-id');

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: { agentId: 'agent-id', read: false },
        data: { read: true },
      });
    });
  });

  describe('Connection Stats', () => {
    it('should return connection stats', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      await gateway.handleConnection(mockSocket as any);

      const stats = gateway.getConnectionStats();

      expect(stats.totalConnections).toBe(1);
      expect(stats.uniqueAgents).toBe(1);
      expect(stats.onlineAgents).toContain('agent-id');
    });

    it('should check if agent is online', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'TestAgent',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      await gateway.handleConnection(mockSocket as any);

      const isOnline = gateway.isAgentOnline('agent-id');

      expect(isOnline).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors in connection', async () => {
      mockPrismaService.agent.findUnique.mockRejectedValue(
        new Error('Database error')
      );

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should handle notification creation errors', async () => {
      mockPrismaService.notification.create.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        gateway.sendNotificationToAgent('agent-id', {
          type: 'test',
          title: 'Test',
          message: 'Message',
        })
      ).rejects.toThrow();
    });
  });
});
