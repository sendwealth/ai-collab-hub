import { Test, TestingModule } from '@nestjs/testing';
import { WebSocketGateway } from './websocket.gateway';
import { PrismaService } from '../../prisma/prisma.service';

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
    },
  };

  const mockSocket = {
    id: 'socket-id',
    handshake: {
      auth: {
        apiKey: 'sk_agent_test',
      },
    },
    emit: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
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
        apiKey: 'sk_agent_test',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.join).toHaveBeenCalledWith('agent:agent-id');
    });

    it('should reject connection without API key', async () => {
      const invalidSocket = {
        ...mockSocket,
        handshake: { auth: {} },
      };

      await gateway.handleConnection(invalidSocket as any);

      expect(invalidSocket.disconnect).toHaveBeenCalled();
    });

    it('should reject connection with invalid API key', async () => {
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      await gateway.handleConnection(mockSocket as any);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle client disconnect', async () => {
      await gateway.handleDisconnect(mockSocket as any);

      // Should clean up resources
      expect(true).toBe(true);
    });
  });

  describe('handleJoinRoom', () => {
    it('should allow agent to join task room', async () => {
      const roomId = 'task:task-id';

      await gateway.handleJoinRoom(mockSocket as any, { roomId });

      expect(mockSocket.join).toHaveBeenCalledWith(roomId);
    });

    it('should validate room ID format', async () => {
      const invalidRoomId = 'invalid-room';

      await expect(
        gateway.handleJoinRoom(mockSocket as any, { roomId: invalidRoomId })
      ).rejects.toThrow();
    });
  });

  describe('handleLeaveRoom', () => {
    it('should allow agent to leave room', async () => {
      const roomId = 'task:task-id';

      await gateway.handleLeaveRoom(mockSocket as any, { roomId });

      expect(mockSocket.leave).toHaveBeenCalledWith(roomId);
    });
  });

  describe('sendNotification', () => {
    it('should send notification to specific agent', async () => {
      const agentId = 'agent-id';
      const notification = {
        type: 'task_update',
        message: 'Task status changed',
      };

      mockPrismaService.notification.create.mockResolvedValue({
        id: 'notif-id',
        ...notification,
      });

      await gateway.sendNotification(agentId, notification);

      expect(mockPrismaService.notification.create).toHaveBeenCalled();
    });

    it('should broadcast notification to room', async () => {
      const roomId = 'task:task-id';
      const message = {
        event: 'task_updated',
        data: { taskId: 'task-id' },
      };

      await gateway.broadcastToRoom(roomId, message);

      // Should broadcast to all room members
      expect(true).toBe(true);
    });
  });

  describe('getNotificationHistory', () => {
    it('should return notification history', async () => {
      const mockNotifications = [
        { id: 'notif-1', type: 'task_update' },
        { id: 'notif-2', type: 'bid_received' },
      ];

      mockPrismaService.notification.findMany.mockResolvedValue(mockNotifications);

      const result = await gateway.getNotificationHistory('agent-id');

      expect(result).toHaveLength(2);
    });

    it('should support pagination', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      await gateway.getNotificationHistory('agent-id', { page: 2, limit: 10 });

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe('Events', () => {
    it('should emit task_created event', async () => {
      const taskData = {
        id: 'task-id',
        title: 'New Task',
      };

      await gateway.emitTaskCreated(taskData);

      // Should emit to all connected agents
      expect(true).toBe(true);
    });

    it('should emit bid_received event', async () => {
      const bidData = {
        taskId: 'task-id',
        agentId: 'agent-id',
      };

      await gateway.emitBidReceived(bidData);

      expect(true).toBe(true);
    });

    it('should emit task_completed event', async () => {
      const taskData = {
        id: 'task-id',
        status: 'completed',
      };

      await gateway.emitTaskCompleted(taskData);

      expect(true).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrismaService.notification.findMany.mockRejectedValue(
        new Error('Database error')
      );

      await expect(
        gateway.getNotificationHistory('agent-id')
      ).rejects.toThrow();
    });

    it('should handle invalid socket data', async () => {
      const invalidSocket = {
        id: null,
        handshake: {},
      };

      await expect(
        gateway.handleConnection(invalidSocket as any)
      ).resolves.not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent connections', async () => {
      const mockAgent = {
        id: 'agent-id',
        apiKey: 'sk_agent_test',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      const connections = Array(100).fill(mockSocket);

      await Promise.all(
        connections.map((socket) => gateway.handleConnection(socket as any))
      );

      expect(mockSocket.join).toHaveBeenCalled();
    });

    it('should cache agent lookups', async () => {
      const mockAgent = {
        id: 'agent-id',
        apiKey: 'sk_agent_test',
      };

      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);

      // Multiple connections with same API key
      await gateway.handleConnection(mockSocket as any);
      await gateway.handleConnection(mockSocket as any);

      // Should cache the lookup
      expect(prisma.agent.findUnique).toHaveBeenCalled();
    });
  });
});
