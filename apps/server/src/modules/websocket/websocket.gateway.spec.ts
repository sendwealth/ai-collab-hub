import { Test, TestingModule } from '@nestjs/testing';
import { WebSocketGateway } from './websocket.gateway';
import { PrismaService } from '../common/prisma/prisma.service';

describe('WebSocketGateway', () => {
  let gateway: WebSocketGateway;

  const mockPrismaService = {
    // Mock any prisma methods needed
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  // Add more specific tests here as needed
  // Note: WebSocket testing requires mocking Socket.io server and clients
});
