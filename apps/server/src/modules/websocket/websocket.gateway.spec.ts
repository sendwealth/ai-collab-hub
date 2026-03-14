import { Test, TestingModule } from '@nestjs/testing';
import { WebSocketGateway } from './websocket.gateway';
import { PrismaService } from '../common/prisma/prisma.service';

describe('WebSocketGateway', () => {
  let gateway: WebSocketGateway;
  let mockPrismaService: any;
  let mockServer: any;

  // Helper to create mock socket
  const createMockSocket = (id: string, apiKey?: string): any => {
    return {
      id,
      handshake: {
        auth: apiKey ? { apiKey } : {},
        headers: apiKey ? { 'x-api-key': apiKey } : {},
      },
      join: jest.fn(),
      leave: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };
  };

  beforeEach(async () => {
    // Create mock PrismaService
    mockPrismaService = {
      agent: {
        findUnique: jest.fn(),
      },
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    // Create mock Server
    mockServer = {
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };

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
    // Inject mock server
    gateway.server = mockServer;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Gateway Initialization', () => {
    it('should be defined', () => {
      expect(gateway).toBeDefined();
    });

    it('should initialize with empty connected agents map', () => {
      const stats = gateway.getConnectionStats();
      expect(stats.totalConnections).toBe(0);
      expect(stats.uniqueAgents).toBe(0);
      expect(stats.onlineAgents).toEqual([]);
    });
  });

  describe('handleConnection', () => {
    let mockSocket: any;

    describe('Authentication', () => {
      it('should disconnect client without API key', async () => {
        mockSocket = createMockSocket('socket-1');

        await gateway.handleConnection(mockSocket);

        expect(mockSocket.disconnect).toHaveBeenCalled();
        expect(gateway.getConnectionStats().totalConnections).toBe(0);
      });

      it('should disconnect client with invalid API key', async () => {
        mockSocket = createMockSocket('socket-2', 'invalid-key');
        mockPrismaService.agent.findUnique.mockResolvedValue(null);

        await gateway.handleConnection(mockSocket);

        expect(mockSocket.disconnect).toHaveBeenCalled();
        expect(mockPrismaService.agent.findUnique).toHaveBeenCalledWith({
          where: { apiKey: 'invalid-key' },
          select: { id: true, name: true },
        });
      });

      it('should successfully authenticate valid agent', async () => {
        mockSocket = createMockSocket('socket-3', 'valid-key');
        const mockAgent = { id: 'agent-1', name: 'Test Agent' };
        mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
        mockPrismaService.notification.findMany.mockResolvedValue([]);

        await gateway.handleConnection(mockSocket);

        expect(mockSocket.join).toHaveBeenCalledWith('agent:agent-1');
        expect(mockSocket.emit).toHaveBeenCalledWith('connected', {
          message: 'Successfully connected to notification service',
          agentId: 'agent-1',
          timestamp: expect.any(String),
        });
        expect(gateway.getConnectionStats().totalConnections).toBe(1);
      });

      it('should accept API key from headers', async () => {
        mockSocket = {
          id: 'socket-4',
          handshake: {
            auth: {},
            headers: { 'x-api-key': 'header-key' },
          },
          join: jest.fn(),
          leave: jest.fn(),
          emit: jest.fn(),
          disconnect: jest.fn(),
          to: jest.fn().mockReturnThis(),
        };

        const mockAgent = { id: 'agent-2', name: 'Header Agent' };
        mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
        mockPrismaService.notification.findMany.mockResolvedValue([]);

        await gateway.handleConnection(mockSocket);

        expect(mockPrismaService.agent.findUnique).toHaveBeenCalledWith({
          where: { apiKey: 'header-key' },
          select: { id: true, name: true },
        });
        expect(mockSocket.join).toHaveBeenCalledWith('agent:agent-2');
      });

      it('should handle connection errors gracefully', async () => {
        mockSocket = createMockSocket('socket-5', 'error-key');
        mockPrismaService.agent.findUnique.mockRejectedValue(new Error('Database error'));

        await gateway.handleConnection(mockSocket);

        expect(mockSocket.disconnect).toHaveBeenCalled();
      });
    });

    describe('Multi-connection Support', () => {
      it('should track multiple sockets for same agent', async () => {
        const mockAgent = { id: 'agent-1', name: 'Test Agent' };
        mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
        mockPrismaService.notification.findMany.mockResolvedValue([]);

        const socket1 = createMockSocket('socket-1', 'key-1');
        const socket2 = createMockSocket('socket-2', 'key-1');

        await gateway.handleConnection(socket1);
        await gateway.handleConnection(socket2);

        const stats = gateway.getConnectionStats();
        expect(stats.totalConnections).toBe(2);
        expect(stats.uniqueAgents).toBe(1);
        expect(gateway.isAgentOnline('agent-1')).toBe(true);
      });
    });

    describe('Pending Notifications', () => {
      it('should send pending notifications on connect', async () => {
        mockSocket = createMockSocket('socket-6', 'valid-key');
        const mockAgent = { id: 'agent-1', name: 'Test Agent' };
        const mockNotifications = [
          { id: 'notif-1', type: 'test', title: 'Test', message: 'Message', read: false },
          { id: 'notif-2', type: 'test2', title: 'Test2', message: 'Message2', read: false },
        ];

        mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
        mockPrismaService.notification.findMany.mockResolvedValue(mockNotifications);

        await gateway.handleConnection(mockSocket);

        expect(mockSocket.emit).toHaveBeenCalledWith('notifications:pending', {
          count: 2,
          notifications: mockNotifications,
        });
      });

      it('should not emit if no pending notifications', async () => {
        mockSocket = createMockSocket('socket-7', 'valid-key');
        const mockAgent = { id: 'agent-1', name: 'Test Agent' };
        mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
        mockPrismaService.notification.findMany.mockResolvedValue([]);

        await gateway.handleConnection(mockSocket);

        // Should only emit 'connected', not 'notifications:pending'
        expect(mockSocket.emit).toHaveBeenCalledTimes(1);
        expect(mockSocket.emit).toHaveBeenCalledWith('connected', expect.any(Object));
      });
    });
  });

  describe('handleDisconnect', () => {
    it('should handle disconnect for connected client', async () => {
      const mockAgent = { id: 'agent-1', name: 'Test Agent' };
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      const mockSocket = createMockSocket('socket-1', 'key-1');
      await gateway.handleConnection(mockSocket);

      expect(gateway.getConnectionStats().totalConnections).toBe(1);

      await gateway.handleDisconnect(mockSocket);

      const stats = gateway.getConnectionStats();
      expect(stats.totalConnections).toBe(0);
      expect(stats.uniqueAgents).toBe(0);
    });

    it('should handle disconnect for unknown client', async () => {
      const mockSocket = createMockSocket('unknown-socket');

      await gateway.handleDisconnect(mockSocket);

      // Should not throw
      expect(gateway.getConnectionStats().totalConnections).toBe(0);
    });

    it('should maintain agent online if other sockets remain', async () => {
      const mockAgent = { id: 'agent-1', name: 'Test Agent' };
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      const socket1 = createMockSocket('socket-1', 'key-1');
      const socket2 = createMockSocket('socket-2', 'key-1');

      await gateway.handleConnection(socket1);
      await gateway.handleConnection(socket2);

      expect(gateway.isAgentOnline('agent-1')).toBe(true);

      await gateway.handleDisconnect(socket1);

      expect(gateway.isAgentOnline('agent-1')).toBe(true);
      expect(gateway.getConnectionStats().totalConnections).toBe(1);
    });
  });

  describe('handleJoinRoom', () => {
    it('should reject join for unauthenticated client', async () => {
      const mockSocket = createMockSocket('socket-1');

      const result = await gateway.handleJoinRoom(mockSocket, { roomId: 'task:123' });

      expect(result).toEqual({ success: false, error: 'Not authenticated' });
    });

    it('should join valid task room', async () => {
      const mockAgent = { id: 'agent-1', name: 'Test Agent' };
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      const mockSocket = createMockSocket('socket-1', 'key-1');
      await gateway.handleConnection(mockSocket);

      const result = await gateway.handleJoinRoom(mockSocket, { roomId: 'task:123' });

      expect(result).toEqual({ success: true, roomId: 'task:123' });
      expect(mockSocket.join).toHaveBeenCalledWith('task:123');
    });

    it('should join valid project room', async () => {
      const mockAgent = { id: 'agent-1', name: 'Test Agent' };
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      const mockSocket = createMockSocket('socket-1', 'key-1');
      await gateway.handleConnection(mockSocket);

      const result = await gateway.handleJoinRoom(mockSocket, { roomId: 'project:456' });

      expect(result).toEqual({ success: true, roomId: 'project:456' });
      expect(mockSocket.join).toHaveBeenCalledWith('project:456');
    });

    it('should join valid team room', async () => {
      const mockAgent = { id: 'agent-1', name: 'Test Agent' };
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      const mockSocket = createMockSocket('socket-1', 'key-1');
      await gateway.handleConnection(mockSocket);

      const result = await gateway.handleJoinRoom(mockSocket, { roomId: 'team:789' });

      expect(result).toEqual({ success: true, roomId: 'team:789' });
    });

    it('should reject invalid room ID format', async () => {
      const mockAgent = { id: 'agent-1', name: 'Test Agent' };
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      const mockSocket = createMockSocket('socket-1', 'key-1');
      await gateway.handleConnection(mockSocket);

      const result = await gateway.handleJoinRoom(mockSocket, { roomId: 'invalid:room' });

      expect(result).toEqual({ success: false, error: 'Invalid room ID format' });
      expect(mockSocket.join).not.toHaveBeenCalledWith('invalid:room');
    });

    it('should track joined rooms for agent', async () => {
      const mockAgent = { id: 'agent-1', name: 'Test Agent' };
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      const mockSocket = createMockSocket('socket-1', 'key-1');
      await gateway.handleConnection(mockSocket);

      await gateway.handleJoinRoom(mockSocket, { roomId: 'task:123' });
      await gateway.handleJoinRoom(mockSocket, { roomId: 'project:456' });

      // Verify socket joined both rooms
      expect(mockSocket.join).toHaveBeenCalledTimes(3); // 1 for agent room, 2 for custom rooms
    });
  });

  describe('handleLeaveRoom', () => {
    it('should reject leave for unauthenticated client', async () => {
      const mockSocket = createMockSocket('socket-1');

      const result = await gateway.handleLeaveRoom(mockSocket, { roomId: 'task:123' });

      expect(result).toEqual({ success: false, error: 'Not authenticated' });
    });

    it('should leave room successfully', async () => {
      const mockAgent = { id: 'agent-1', name: 'Test Agent' };
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      const mockSocket = createMockSocket('socket-1', 'key-1');
      await gateway.handleConnection(mockSocket);
      await gateway.handleJoinRoom(mockSocket, { roomId: 'task:123' });

      const result = await gateway.handleLeaveRoom(mockSocket, { roomId: 'task:123' });

      expect(result).toEqual({ success: true, roomId: 'task:123' });
      expect(mockSocket.leave).toHaveBeenCalledWith('task:123');
    });
  });

  describe('sendNotificationToAgent', () => {
    it('should create notification in database', async () => {
      const mockNotification = {
        id: 'notif-1',
        agentId: 'agent-1',
        type: 'test',
        title: 'Test',
        message: 'Message',
        data: {},
        read: false,
        createdAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      const result = await gateway.sendNotificationToAgent('agent-1', {
        type: 'test',
        title: 'Test',
        message: 'Message',
      });

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          agentId: 'agent-1',
          type: 'test',
          title: 'Test',
          message: 'Message',
          data: {},
          read: false,
        },
      });
      expect(result).toEqual(mockNotification);
    });

    it('should emit notification to online agent', async () => {
      const mockAgent = { id: 'agent-1', name: 'Test Agent' };
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockResolvedValue([]);

      const mockNotification = {
        id: 'notif-1',
        agentId: 'agent-1',
        type: 'test',
        title: 'Test',
        message: 'Message',
        data: {},
        read: false,
        createdAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      // Connect agent first
      const mockSocket = createMockSocket('socket-1', 'key-1');
      await gateway.handleConnection(mockSocket);

      await gateway.sendNotificationToAgent('agent-1', {
        type: 'test',
        title: 'Test',
        message: 'Message',
      });

      expect(mockServer.to).toHaveBeenCalledWith('agent:agent-1');
      expect(mockServer.emit).toHaveBeenCalledWith('notification', {
        id: 'notif-1',
        type: 'test',
        title: 'Test',
        message: 'Message',
        timestamp: expect.any(String),
      });
    });

    it('should not emit if agent is offline', async () => {
      const mockNotification = {
        id: 'notif-1',
        agentId: 'agent-1',
        type: 'test',
        title: 'Test',
        message: 'Message',
        data: {},
        read: false,
        createdAt: new Date(),
      };

      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      await gateway.sendNotificationToAgent('agent-1', {
        type: 'test',
        title: 'Test',
        message: 'Message',
      });

      expect(mockServer.to).not.toHaveBeenCalled();
    });

    it('should handle notification creation errors', async () => {
      mockPrismaService.notification.create.mockRejectedValue(new Error('Database error'));

      await expect(
        gateway.sendNotificationToAgent('agent-1', {
          type: 'test',
          title: 'Test',
          message: 'Message',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('broadcastToRoom', () => {
    it('should broadcast event to room', async () => {
      await gateway.broadcastToRoom('task:123', 'task:updated', { status: 'in_progress' });

      expect(mockServer.to).toHaveBeenCalledWith('task:123');
      expect(mockServer.emit).toHaveBeenCalledWith('task:updated', { status: 'in_progress' });
    });
  });

  describe('Task Events', () => {
    describe('emitTaskCreated', () => {
      it('should broadcast new task to all agents', async () => {
        const task = {
          id: 'task-1',
          title: 'New Task',
          category: 'development',
          reward: 100,
        };

        await gateway.emitTaskCreated(task);

        expect(mockServer.emit).toHaveBeenCalledWith('task:created', {
          taskId: 'task-1',
          title: 'New Task',
          category: 'development',
          reward: 100,
          timestamp: expect.any(String),
        });
      });
    });

    describe('emitTaskUpdated', () => {
      it('should broadcast update to task room', async () => {
        const task = {
          id: 'task-1',
          title: 'Updated Task',
          status: 'in_progress',
        };

        await gateway.emitTaskUpdated(task, 'status_change');

        expect(mockServer.to).toHaveBeenCalledWith('task:task-1');
        expect(mockServer.emit).toHaveBeenCalledWith('task:updated', {
          taskId: 'task-1',
          updateType: 'status_change',
          status: 'in_progress',
          timestamp: expect.any(String),
        });
      });

      it('should notify task creator', async () => {
        const task = {
          id: 'task-1',
          title: 'Task',
          status: 'in_progress',
          creatorId: 'creator-1',
        };

        mockPrismaService.notification.create.mockResolvedValue({});

        await gateway.emitTaskUpdated(task, 'status_change');

        expect(mockPrismaService.notification.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              agentId: 'creator-1',
              type: 'task_update',
            }),
          })
        );
      });

      it('should notify task assignee', async () => {
        const task = {
          id: 'task-1',
          title: 'Task',
          status: 'in_progress',
          assigneeId: 'assignee-1',
        };

        mockPrismaService.notification.create.mockResolvedValue({});

        await gateway.emitTaskUpdated(task, 'status_change');

        expect(mockPrismaService.notification.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              agentId: 'assignee-1',
              type: 'task_update',
            }),
          })
        );
      });
    });

    describe('emitBidReceived', () => {
      it('should notify task creator about new bid', async () => {
        const task = {
          id: 'task-1',
          title: 'Task',
          creatorId: 'creator-1',
        };
        const bid = {
          id: 'bid-1',
          agentId: 'bidder-1',
        };

        mockPrismaService.notification.create.mockResolvedValue({});

        await gateway.emitBidReceived(task, bid);

        expect(mockPrismaService.notification.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              agentId: 'creator-1',
              type: 'bid_received',
            }),
          })
        );
      });
    });

    describe('emitBidAccepted', () => {
      it('should notify bidder', async () => {
        const task = {
          id: 'task-1',
          title: 'Task',
        };
        const bid = {
          id: 'bid-1',
          agentId: 'bidder-1',
        };

        mockPrismaService.notification.create.mockResolvedValue({});

        await gateway.emitBidAccepted(task, bid);

        expect(mockPrismaService.notification.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              agentId: 'bidder-1',
              type: 'bid_accepted',
            }),
          })
        );
      });
    });

    describe('emitTaskCompleted', () => {
      it('should notify creator and assignee', async () => {
        const task = {
          id: 'task-1',
          title: 'Task',
          reward: 100,
          creatorId: 'creator-1',
          assigneeId: 'assignee-1',
        };

        mockPrismaService.notification.create.mockResolvedValue({});

        await gateway.emitTaskCompleted(task);

        expect(mockPrismaService.notification.create).toHaveBeenCalledTimes(2);
        expect(mockPrismaService.notification.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              agentId: 'creator-1',
              type: 'task_completed',
            }),
          })
        );
        expect(mockPrismaService.notification.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              agentId: 'assignee-1',
              type: 'task_completed',
            }),
          })
        );
      });
    });
  });

  describe('Notification History', () => {
    describe('getNotificationHistory', () => {
      it('should return paginated notifications', async () => {
        const mockNotifications = [
          { id: 'notif-1', type: 'test1' },
          { id: 'notif-2', type: 'test2' },
        ];

        mockPrismaService.notification.findMany.mockResolvedValue(mockNotifications);
        mockPrismaService.notification.count.mockResolvedValue(25);

        const result = await gateway.getNotificationHistory('agent-1', {
          page: 2,
          limit: 10,
        });

        expect(result).toEqual({
          notifications: mockNotifications,
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        });

        expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
          where: { agentId: 'agent-1' },
          orderBy: { createdAt: 'desc' },
          skip: 10, // (page - 1) * limit
          take: 10,
        });
      });

      it('should filter unread only', async () => {
        const mockNotifications = [{ id: 'notif-1', read: false }];
        mockPrismaService.notification.findMany.mockResolvedValue(mockNotifications);
        mockPrismaService.notification.count.mockResolvedValue(5);

        const result = await gateway.getNotificationHistory('agent-1', {
          unreadOnly: true,
        });

        expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
          where: { agentId: 'agent-1', read: false },
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20, // default limit
        });

        expect(result.notifications).toEqual(mockNotifications);
      });

      it('should use default pagination values', async () => {
        mockPrismaService.notification.findMany.mockResolvedValue([]);
        mockPrismaService.notification.count.mockResolvedValue(0);

        const result = await gateway.getNotificationHistory('agent-1');

        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.totalPages).toBe(0);
      });
    });

    describe('markAsRead', () => {
      it('should mark notification as read', async () => {
        mockPrismaService.notification.updateMany.mockResolvedValue({ count: 1 });

        await gateway.markAsRead('notif-1', 'agent-1');

        expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
          where: { id: 'notif-1', agentId: 'agent-1' },
          data: { read: true },
        });
      });

      it('should only update notification for correct agent', async () => {
        mockPrismaService.notification.updateMany.mockResolvedValue({ count: 0 });

        await gateway.markAsRead('notif-1', 'agent-1');

        expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
          where: { id: 'notif-1', agentId: 'agent-1' },
          data: { read: true },
        });
      });
    });

    describe('markAllAsRead', () => {
      it('should mark all notifications as read for agent', async () => {
        mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

        await gateway.markAllAsRead('agent-1');

        expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
          where: { agentId: 'agent-1', read: false },
          data: { read: true },
        });
      });
    });
  });

  describe('Connection Statistics', () => {
    describe('getOnlineAgents', () => {
      it('should return empty array when no agents online', () => {
        const result = gateway.getOnlineAgents();
        expect(result).toEqual([]);
      });

      it('should return list of online agents', async () => {
        const mockAgent1 = { id: 'agent-1', name: 'Agent 1' };
        const mockAgent2 = { id: 'agent-2', name: 'Agent 2' };
        mockPrismaService.agent.findUnique
          .mockResolvedValueOnce(mockAgent1)
          .mockResolvedValueOnce(mockAgent2);
        mockPrismaService.notification.findMany.mockResolvedValue([]);

        const socket1 = createMockSocket('socket-1', 'key-1');
        const socket2 = createMockSocket('socket-2', 'key-2');

        await gateway.handleConnection(socket1);
        await gateway.handleConnection(socket2);

        const result = gateway.getOnlineAgents();
        expect(result).toContain('agent-1');
        expect(result).toContain('agent-2');
        expect(result.length).toBe(2);
      });
    });

    describe('isAgentOnline', () => {
      it('should return false for offline agent', () => {
        expect(gateway.isAgentOnline('offline-agent')).toBe(false);
      });

      it('should return true for online agent', async () => {
        const mockAgent = { id: 'agent-1', name: 'Agent 1' };
        mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
        mockPrismaService.notification.findMany.mockResolvedValue([]);

        const socket = createMockSocket('socket-1', 'key-1');
        await gateway.handleConnection(socket);

        expect(gateway.isAgentOnline('agent-1')).toBe(true);
      });

      it('should return false after agent disconnects all sockets', async () => {
        const mockAgent = { id: 'agent-1', name: 'Agent 1' };
        mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
        mockPrismaService.notification.findMany.mockResolvedValue([]);

        const socket = createMockSocket('socket-1', 'key-1');
        await gateway.handleConnection(socket);

        expect(gateway.isAgentOnline('agent-1')).toBe(true);

        await gateway.handleDisconnect(socket);

        expect(gateway.isAgentOnline('agent-1')).toBe(false);
      });
    });

    describe('getConnectionStats', () => {
      it('should return correct stats for multiple connections', async () => {
        const mockAgent1 = { id: 'agent-1', name: 'Agent 1' };
        const mockAgent2 = { id: 'agent-2', name: 'Agent 2' };
        mockPrismaService.agent.findUnique
          .mockResolvedValueOnce(mockAgent1)
          .mockResolvedValueOnce(mockAgent1)
          .mockResolvedValueOnce(mockAgent2);
        mockPrismaService.notification.findMany.mockResolvedValue([]);

        // Agent 1 connects twice
        const socket1 = createMockSocket('socket-1', 'key-1');
        const socket2 = createMockSocket('socket-2', 'key-1');
        // Agent 2 connects once
        const socket3 = createMockSocket('socket-3', 'key-2');

        await gateway.handleConnection(socket1);
        await gateway.handleConnection(socket2);
        await gateway.handleConnection(socket3);

        const stats = gateway.getConnectionStats();

        expect(stats.totalConnections).toBe(3);
        expect(stats.uniqueAgents).toBe(2);
        expect(stats.onlineAgents.length).toBe(2);
        expect(stats.onlineAgents).toContain('agent-1');
        expect(stats.onlineAgents).toContain('agent-2');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors during connection', async () => {
      const socket = createMockSocket('socket-1', 'key-1');
      mockPrismaService.agent.findUnique.mockRejectedValue(new Error('DB Error'));

      await gateway.handleConnection(socket);

      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should handle database errors during notification sending', async () => {
      mockPrismaService.notification.create.mockRejectedValue(new Error('DB Error'));

      await expect(
        gateway.sendNotificationToAgent('agent-1', {
          type: 'test',
          title: 'Test',
          message: 'Message',
        })
      ).rejects.toThrow('DB Error');
    });

    it('should handle errors when fetching pending notifications', async () => {
      const mockAgent = { id: 'agent-1', name: 'Test Agent' };
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.notification.findMany.mockRejectedValue(new Error('DB Error'));

      const socket = createMockSocket('socket-1', 'key-1');

      // Should not throw
      await gateway.handleConnection(socket);

      // Should still connect successfully
      expect(socket.emit).toHaveBeenCalledWith('connected', expect.any(Object));
    });
  });
});
