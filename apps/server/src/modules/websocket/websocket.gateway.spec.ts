import { Test, TestingModule } from '@nestjs/testing';
import { WebsocketGateway } from './websocket.gateway';
import { AgentsService } from '../agents/agents.service';
import { Socket } from 'socket.io';

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;

  const mockAgentsService = {
    validateByApiKey: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockSocket = {
    id: 'socket-id',
    handshake: {
      auth: {},
      headers: {},
    },
    data: {},
    disconnect: jest.fn(),
    emit: jest.fn(),
  } as unknown as Socket;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsocketGateway,
        {
          provide: AgentsService,
          useValue: mockAgentsService,
        },
      ],
    }).compile();

    gateway = module.get<WebsocketGateway>(WebsocketGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should accept connection with valid API key', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'Test Agent',
      };

      mockSocket.handshake.auth = { apiKey: 'valid-api-key' };
      mockAgentsService.validateByApiKey.mockResolvedValue(mockAgent);
      mockAgentsService.updateStatus.mockResolvedValue({});

      await gateway.handleConnection(mockSocket);

      expect(mockAgentsService.validateByApiKey).toHaveBeenCalledWith('valid-api-key');
      expect(mockSocket.data.agentId).toBe('agent-id');
      expect(mockAgentsService.updateStatus).toHaveBeenCalledWith('agent-id', { status: 'idle' });
    });

    it('should accept connection with API key in headers', async () => {
      const mockAgent = {
        id: 'agent-id',
        name: 'Test Agent',
      };

      mockSocket.handshake.auth = {};
      mockSocket.handshake.headers = { 'x-api-key': 'header-api-key' };
      mockAgentsService.validateByApiKey.mockResolvedValue(mockAgent);
      mockAgentsService.updateStatus.mockResolvedValue({});

      await gateway.handleConnection(mockSocket);

      expect(mockAgentsService.validateByApiKey).toHaveBeenCalledWith('header-api-key');
    });

    it('should reject connection without API key', async () => {
      mockSocket.handshake.auth = {};
      mockSocket.handshake.headers = {};

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
      expect(mockAgentsService.validateByApiKey).not.toHaveBeenCalled();
    });

    it('should reject connection with invalid API key', async () => {
      mockSocket.handshake.auth = { apiKey: 'invalid-key' };
      mockAgentsService.validateByApiKey.mockResolvedValue(null);

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });

    it('should handle connection error gracefully', async () => {
      mockSocket.handshake.auth = { apiKey: 'error-key' };
      mockAgentsService.validateByApiKey.mockRejectedValue(new Error('Database error'));

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalledWith(true);
    });
  });

  describe('handleDisconnect', () => {
    it('should update status to offline on disconnect', async () => {
      mockSocket.data.agentId = 'agent-id';
      mockAgentsService.updateStatus.mockResolvedValue({});

      await gateway.handleDisconnect(mockSocket);

      expect(mockAgentsService.updateStatus).toHaveBeenCalledWith('agent-id', { status: 'offline' });
    });

    it('should handle disconnect without agentId', async () => {
      mockSocket.data = {};

      await gateway.handleDisconnect(mockSocket);

      expect(mockAgentsService.updateStatus).not.toHaveBeenCalled();
    });

    it('should handle update status error on disconnect', async () => {
      mockSocket.data.agentId = 'agent-id';
      mockAgentsService.updateStatus.mockRejectedValue(new Error('Agent not found'));

      // Should not throw
      await gateway.handleDisconnect(mockSocket);

      expect(mockAgentsService.updateStatus).toHaveBeenCalled();
    });
  });

  describe('sendToAgent', () => {
    it('should send message to connected agent', () => {
      const mockEmit = jest.fn();
      const mockAgentSocket = {
        emit: mockEmit,
      } as unknown as Socket;

      // Manually add to connectedAgents map
      (gateway as any).connectedAgents.set('agent-id', mockAgentSocket);

      gateway.sendToAgent('agent-id', 'test:event', { data: 'test' });

      expect(mockEmit).toHaveBeenCalledWith('test:event', { data: 'test' });
    });

    it('should do nothing if agent not connected', () => {
      gateway.sendToAgent('non-existent-agent', 'test:event', { data: 'test' });

      // Should not throw
    });
  });

  describe('broadcast', () => {
    it('should broadcast message to all agents', () => {
      const mockServer = {
        emit: jest.fn(),
      };

      (gateway as any).server = mockServer as any;

      gateway.broadcast('test:event', { data: 'test' });

      expect(mockServer.emit).toHaveBeenCalledWith('test:event', { data: 'test' });
    });
  });

  describe('broadcastTaskAvailable', () => {
    it('should broadcast task available event', () => {
      const mockServer = {
        emit: jest.fn(),
      };

      (gateway as any).server = mockServer as any;

      const task = { id: 'task-id', title: 'Test Task' };
      gateway.broadcastTaskAvailable(task);

      expect(mockServer.emit).toHaveBeenCalledWith('task:available', task);
    });
  });

  describe('notifyTaskAssigned', () => {
    it('should send task assigned notification', () => {
      const mockEmit = jest.fn();
      const mockAgentSocket = {
        emit: mockEmit,
      } as unknown as Socket;

      (gateway as any).connectedAgents.set('agent-id', mockAgentSocket);

      const task = { id: 'task-id', title: 'Test Task' };
      gateway.notifyTaskAssigned('agent-id', task);

      expect(mockEmit).toHaveBeenCalledWith('task:assigned', task);
    });
  });

  describe('notifyTaskCompleted', () => {
    it('should send task completed notification', () => {
      const mockEmit = jest.fn();
      const mockAgentSocket = {
        emit: mockEmit,
      } as unknown as Socket;

      (gateway as any).connectedAgents.set('agent-id', mockAgentSocket);

      const task = { id: 'task-id', title: 'Test Task' };
      gateway.notifyTaskCompleted('agent-id', task);

      expect(mockEmit).toHaveBeenCalledWith('task:completed', task);
    });
  });

  describe('getOnlineAgentCount', () => {
    it('should return 0 when no agents connected', () => {
      expect(gateway.getOnlineAgentCount()).toBe(0);
    });

    it('should return correct count of connected agents', () => {
      (gateway as any).connectedAgents.set('agent-1', {} as Socket);
      (gateway as any).connectedAgents.set('agent-2', {} as Socket);

      expect(gateway.getOnlineAgentCount()).toBe(2);
    });
  });
});
