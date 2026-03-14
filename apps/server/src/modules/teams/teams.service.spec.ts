import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

describe('TeamsService', () => {
  let service: TeamsService;
  let prisma: any;

  const mockPrismaService: any = {
    team: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    teamMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    agent: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTeam', () => {
    it('should create a team successfully', async () => {
      const createDto = {
        name: 'Test Team',
        description: 'Test Description',
      };

      const mockTeam = {
        id: 'team-id',
        name: createDto.name,
        description: createDto.description,
        ownerId: 'owner-id',
        createdAt: new Date(),
        owner: {
          id: 'owner-id',
          name: 'Owner Name',
          description: 'Owner Description',
        },
      };

      const mockTeamMember = {
        id: 'member-id',
        teamId: 'team-id',
        agentId: 'owner-id',
        role: 'owner',
        joinedAt: new Date(),
      };

      mockPrismaService.team.create.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.create.mockResolvedValue(mockTeamMember);

      const result = await service.createTeam('owner-id', createDto);

      expect(result.id).toBe('team-id');
      expect(result.name).toBe(createDto.name);
      expect(result.message).toBe('Team created successfully');
      expect(prisma.team.create).toHaveBeenCalledWith({
        data: {
          name: createDto.name,
          description: createDto.description,
          ownerId: 'owner-id',
        },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
      expect(prisma.teamMember.create).toHaveBeenCalledWith({
        data: {
          teamId: 'team-id',
          agentId: 'owner-id',
          role: 'owner',
        },
      });
    });

    it('should create team without description', async () => {
      const createDto = {
        name: 'Test Team',
      };

      const mockTeam = {
        id: 'team-id',
        name: createDto.name,
        description: null,
        ownerId: 'owner-id',
        createdAt: new Date(),
        owner: {
          id: 'owner-id',
          name: 'Owner Name',
          description: 'Owner Description',
        },
      };

      mockPrismaService.team.create.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.create.mockResolvedValue({});

      const result = await service.createTeam('owner-id', createDto);

      expect(result.name).toBe(createDto.name);
      expect(result.description).toBeNull();
    });
  });

  describe('getMyTeams', () => {
    it('should return teams for an agent', async () => {
      const mockTeamMembers = [
        {
          teamId: 'team-1',
          agentId: 'agent-id',
          role: 'owner',
          joinedAt: new Date(),
          team: {
            id: 'team-1',
            name: 'Team 1',
            description: 'Description 1',
            createdAt: new Date(),
            owner: {
              id: 'agent-id',
              name: 'Owner',
              description: 'Owner Desc',
            },
            members: [
              {
                agentId: 'agent-id',
                agent: {
                  id: 'agent-id',
                  name: 'Member 1',
                  description: 'Desc 1',
                  status: 'active',
                },
              },
            ],
          },
        },
        {
          teamId: 'team-2',
          agentId: 'agent-id',
          role: 'member',
          joinedAt: new Date(),
          team: {
            id: 'team-2',
            name: 'Team 2',
            description: 'Description 2',
            createdAt: new Date(),
            owner: {
              id: 'owner-2',
              name: 'Owner 2',
              description: 'Owner Desc 2',
            },
            members: [
              {
                agentId: 'agent-id',
                agent: {
                  id: 'agent-id',
                  name: 'Member 1',
                  description: 'Desc 1',
                  status: 'active',
                },
              },
              {
                agentId: 'agent-2',
                agent: {
                  id: 'agent-2',
                  name: 'Member 2',
                  description: 'Desc 2',
                  status: 'idle',
                },
              },
            ],
          },
        },
      ];

      mockPrismaService.teamMember.findMany.mockResolvedValue(mockTeamMembers);

      const result = await service.getMyTeams('agent-id');

      expect(result.total).toBe(2);
      expect(result.teams).toHaveLength(2);
      expect(result.teams[0].myRole).toBe('owner');
      expect(result.teams[1].myRole).toBe('member');
      expect(result.teams[0].memberCount).toBe(1);
      expect(result.teams[1].memberCount).toBe(2);
      expect(prisma.teamMember.findMany).toHaveBeenCalledWith({
        where: { agentId: 'agent-id' },
        include: {
          team: {
            include: {
              owner: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
              members: {
                include: {
                  agent: {
                    select: {
                      id: true,
                      name: true,
                      description: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          joinedAt: 'desc',
        },
      });
    });

    it('should return empty array if no teams', async () => {
      mockPrismaService.teamMember.findMany.mockResolvedValue([]);

      const result = await service.getMyTeams('agent-id');

      expect(result.total).toBe(0);
      expect(result.teams).toHaveLength(0);
    });
  });

  describe('addMember', () => {
    it('should add member successfully as owner', async () => {
      const addMemberDto = {
        agentId: 'new-member-id',
        role: 'member' as const,
      };

      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
        ownerId: 'owner-id',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'owner-id',
        role: 'owner',
      };

      const mockAgent = {
        id: 'new-member-id',
        name: 'New Member',
        description: 'New Member Desc',
        status: 'active',
      };

      const mockTeamMember = {
        id: 'member-2',
        teamId: 'team-id',
        agentId: 'new-member-id',
        role: 'member',
        joinedAt: new Date(),
        agent: mockAgent,
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(null);
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.teamMember.create.mockResolvedValue(mockTeamMember);

      const result = await service.addMember(
        'team-id',
        'owner-id',
        addMemberDto,
      );

      expect(result.message).toBe('Member added successfully');
      expect(result.member.agent.id).toBe('new-member-id');
      expect(result.member.role).toBe('member');
      expect(prisma.teamMember.create).toHaveBeenCalledWith({
        data: {
          teamId: 'team-id',
          agentId: 'new-member-id',
          role: 'member',
        },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
            },
          },
        },
      });
    });

    it('should add member successfully as admin', async () => {
      const addMemberDto = {
        agentId: 'new-member-id',
        role: 'member' as const,
      };

      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'admin-id',
        role: 'admin',
      };

      const mockAgent = {
        id: 'new-member-id',
        name: 'New Member',
      };

      const mockTeamMember = {
        id: 'member-2',
        teamId: 'team-id',
        agentId: 'new-member-id',
        role: 'member',
        joinedAt: new Date(),
        agent: mockAgent,
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(null);
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.teamMember.create.mockResolvedValue(mockTeamMember);

      const result = await service.addMember('team-id', 'admin-id', addMemberDto);

      expect(result.message).toBe('Member added successfully');
    });

    it('should throw NotFoundException if team not found', async () => {
      mockPrismaService.team.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember('invalid-team', 'owner-id', {
          agentId: 'new-member-id',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if requester is not owner or admin', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'member-id',
        role: 'member',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique.mockResolvedValueOnce(mockRequester);

      await expect(
        service.addMember('team-id', 'member-id', {
          agentId: 'new-member-id',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if requester is not a team member', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.addMember('team-id', 'non-member-id', {
          agentId: 'new-member-id',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if agent is already a member', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'owner-id',
        role: 'owner',
      };

      const existingMember = {
        id: 'member-2',
        teamId: 'team-id',
        agentId: 'existing-member-id',
        role: 'member',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(existingMember);

      await expect(
        service.addMember('team-id', 'owner-id', {
          agentId: 'existing-member-id',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if agent not found', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'owner-id',
        role: 'owner',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(null);
      mockPrismaService.agent.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember('team-id', 'owner-id', {
          agentId: 'invalid-agent-id',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should add member with default role if not specified', async () => {
      const addMemberDto = {
        agentId: 'new-member-id',
      };

      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'owner-id',
        role: 'owner',
      };

      const mockAgent = {
        id: 'new-member-id',
        name: 'New Member',
      };

      const mockTeamMember = {
        id: 'member-2',
        teamId: 'team-id',
        agentId: 'new-member-id',
        role: 'member',
        joinedAt: new Date(),
        agent: mockAgent,
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(null);
      mockPrismaService.agent.findUnique.mockResolvedValue(mockAgent);
      mockPrismaService.teamMember.create.mockResolvedValue(mockTeamMember);

      const result = await service.addMember('team-id', 'owner-id', addMemberDto);

      expect(result.member.role).toBe('member');
      expect(prisma.teamMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'member',
          }),
        }),
      );
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully as owner', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'owner-id',
        role: 'owner',
      };

      const mockTarget = {
        id: 'member-2',
        teamId: 'team-id',
        agentId: 'member-id',
        role: 'member',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockTarget);
      mockPrismaService.teamMember.delete.mockResolvedValue(mockTarget);

      const result = await service.removeMember(
        'team-id',
        'owner-id',
        'member-id',
      );

      expect(result.message).toBe('Member removed successfully');
      expect(prisma.teamMember.delete).toHaveBeenCalledWith({
        where: { id: 'member-2' },
      });
    });

    it('should allow admin to remove member', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'admin-id',
        role: 'admin',
      };

      const mockTarget = {
        id: 'member-2',
        teamId: 'team-id',
        agentId: 'member-id',
        role: 'member',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockTarget);
      mockPrismaService.teamMember.delete.mockResolvedValue(mockTarget);

      const result = await service.removeMember(
        'team-id',
        'admin-id',
        'member-id',
      );

      expect(result.message).toBe('Member removed successfully');
    });

    it('should allow member to remove themselves', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'member-id',
        role: 'member',
      };

      const mockTarget = mockRequester;

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockTarget);
      mockPrismaService.teamMember.delete.mockResolvedValue(mockTarget);

      const result = await service.removeMember(
        'team-id',
        'member-id',
        'member-id',
      );

      expect(result.message).toBe('Member removed successfully');
    });

    it('should throw NotFoundException if team not found', async () => {
      mockPrismaService.team.findUnique.mockResolvedValue(null);

      await expect(
        service.removeMember('invalid-team', 'owner-id', 'member-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if requester is not a team member', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.removeMember('team-id', 'non-member-id', 'member-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if target member not found', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'owner-id',
        role: 'owner',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(null);

      await expect(
        service.removeMember('team-id', 'owner-id', 'invalid-member-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if admin tries to remove admin', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'admin-id-1',
        role: 'admin',
      };

      const mockTarget = {
        id: 'member-2',
        teamId: 'team-id',
        agentId: 'admin-id-2',
        role: 'admin',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockTarget);

      await expect(
        service.removeMember('team-id', 'admin-id-1', 'admin-id-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if admin tries to remove owner', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'admin-id',
        role: 'admin',
      };

      const mockTarget = {
        id: 'member-2',
        teamId: 'team-id',
        agentId: 'owner-id',
        role: 'owner',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockTarget);

      await expect(
        service.removeMember('team-id', 'admin-id', 'owner-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if member tries to remove another member', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'member-id-1',
        role: 'member',
      };

      const mockTarget = {
        id: 'member-2',
        teamId: 'team-id',
        agentId: 'member-id-2',
        role: 'member',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockTarget);

      await expect(
        service.removeMember('team-id', 'member-id-1', 'member-id-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when removing last owner', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'owner-id',
        role: 'owner',
      };

      const mockTarget = mockRequester;

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockTarget);
      mockPrismaService.teamMember.count.mockResolvedValue(1);

      await expect(
        service.removeMember('team-id', 'owner-id', 'owner-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow owner to remove themselves if other owners exist', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'owner-id-1',
        role: 'owner',
      };

      const mockTarget = mockRequester;

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockTarget);
      mockPrismaService.teamMember.count.mockResolvedValue(2);
      mockPrismaService.teamMember.delete.mockResolvedValue(mockTarget);

      const result = await service.removeMember(
        'team-id',
        'owner-id-1',
        'owner-id-1',
      );

      expect(result.message).toBe('Member removed successfully');
    });

    it('should throw ForbiddenException if non-owner tries to remove owner', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'admin-id',
        role: 'admin',
      };

      const mockTarget = {
        id: 'member-2',
        teamId: 'team-id',
        agentId: 'owner-id',
        role: 'owner',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockTarget);

      await expect(
        service.removeMember('team-id', 'admin-id', 'owner-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role successfully', async () => {
      const updateRoleDto = {
        role: 'admin' as const,
      };

      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'owner-id',
        role: 'owner',
      };

      const mockTarget = {
        id: 'member-2',
        teamId: 'team-id',
        agentId: 'member-id',
        role: 'member',
        updatedAt: new Date(),
        agent: {
          id: 'member-id',
          name: 'Member',
          description: 'Desc',
          status: 'active',
        },
      };

      const mockUpdatedTarget = {
        ...mockTarget,
        role: 'admin',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockTarget);
      mockPrismaService.teamMember.update.mockResolvedValue(mockUpdatedTarget);

      const result = await service.updateMemberRole(
        'team-id',
        'owner-id',
        'member-id',
        updateRoleDto,
      );

      expect(result.message).toBe('Member role updated successfully');
      expect(result.member.role).toBe('admin');
      expect(prisma.teamMember.update).toHaveBeenCalledWith({
        where: { id: 'member-2' },
        data: { role: 'admin' },
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              description: true,
              status: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if team not found', async () => {
      mockPrismaService.team.findUnique.mockResolvedValue(null);

      await expect(
        service.updateMemberRole('invalid-team', 'owner-id', 'member-id', {
          role: 'admin',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if requester is not owner', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'admin-id',
        role: 'admin',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique.mockResolvedValueOnce(mockRequester);

      await expect(
        service.updateMemberRole('team-id', 'admin-id', 'member-id', {
          role: 'admin',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if requester is not a team member', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.updateMemberRole('team-id', 'non-member-id', 'member-id', {
          role: 'admin',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if target member not found', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'owner-id',
        role: 'owner',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(null);

      await expect(
        service.updateMemberRole('team-id', 'owner-id', 'invalid-member-id', {
          role: 'admin',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if member is already owner', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'owner-id-1',
        role: 'owner',
      };

      const mockTarget = {
        id: 'member-2',
        teamId: 'team-id',
        agentId: 'owner-id-2',
        role: 'owner',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockTarget);

      await expect(
        service.updateMemberRole('team-id', 'owner-id-1', 'owner-id-2', {
          role: 'owner',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow promoting member to owner', async () => {
      const updateRoleDto = {
        role: 'owner' as const,
      };

      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'owner-id',
        role: 'owner',
      };

      const mockTarget = {
        id: 'member-2',
        teamId: 'team-id',
        agentId: 'member-id',
        role: 'member',
        updatedAt: new Date(),
        agent: {
          id: 'member-id',
          name: 'Member',
          description: 'Desc',
          status: 'active',
        },
      };

      const mockUpdatedTarget = {
        ...mockTarget,
        role: 'owner',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockTarget);
      mockPrismaService.teamMember.update.mockResolvedValue(mockUpdatedTarget);

      const result = await service.updateMemberRole(
        'team-id',
        'owner-id',
        'member-id',
        updateRoleDto,
      );

      expect(result.message).toBe('Member role updated successfully');
      expect(result.member.role).toBe('owner');
    });
  });

  describe('getTeamDetails', () => {
    it('should return team details for team member', async () => {
      const mockMember = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'requester-id',
        role: 'admin',
      };

      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
        description: 'Test Description',
        createdAt: new Date(),
        owner: {
          id: 'owner-id',
          name: 'Owner',
          description: 'Owner Desc',
        },
        members: [
          {
            id: 'member-1',
            agentId: 'owner-id',
            role: 'owner',
            joinedAt: new Date(),
            agent: {
              id: 'owner-id',
              name: 'Owner',
              description: 'Owner Desc',
              status: 'active',
              trustScore: 90,
            },
          },
          {
            id: 'member-2',
            agentId: 'requester-id',
            role: 'admin',
            joinedAt: new Date(),
            agent: {
              id: 'requester-id',
              name: 'Requester',
              description: 'Requester Desc',
              status: 'active',
              trustScore: 80,
            },
          },
        ],
      };

      mockPrismaService.teamMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);

      const result = await service.getTeamDetails('team-id', 'requester-id');

      expect(result.id).toBe('team-id');
      expect(result.name).toBe('Test Team');
      expect(result.myRole).toBe('admin');
      expect(result.members).toHaveLength(2);
      expect(result.memberCount).toBe(2);
      expect(prisma.team.findUnique).toHaveBeenCalledWith({
        where: { id: 'team-id' },
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          members: {
            include: {
              agent: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  status: true,
                  trustScore: true,
                },
              },
            },
            orderBy: [
              { role: 'asc' },
              { joinedAt: 'asc' },
            ],
          },
        },
      });
    });

    it('should throw ForbiddenException if not a team member', async () => {
      mockPrismaService.teamMember.findUnique.mockResolvedValue(null);

      await expect(
        service.getTeamDetails('team-id', 'non-member-id'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if team not found', async () => {
      const mockMember = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'requester-id',
        role: 'member',
      };

      mockPrismaService.teamMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.team.findUnique.mockResolvedValue(null);

      await expect(
        service.getTeamDetails('team-id', 'requester-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should order members by role and join date', async () => {
      const mockMember = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'requester-id',
        role: 'member',
      };

      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
        description: 'Test Description',
        createdAt: new Date(),
        owner: {
          id: 'owner-id',
          name: 'Owner',
          description: 'Owner Desc',
        },
        members: [
          {
            id: 'member-1',
            agentId: 'owner-id',
            role: 'owner',
            joinedAt: new Date('2024-01-01'),
            agent: {
              id: 'owner-id',
              name: 'Owner',
              description: 'Owner Desc',
              status: 'active',
              trustScore: 90,
            },
          },
          {
            id: 'member-2',
            agentId: 'admin-id',
            role: 'admin',
            joinedAt: new Date('2024-01-02'),
            agent: {
              id: 'admin-id',
              name: 'Admin',
              description: 'Admin Desc',
              status: 'active',
              trustScore: 85,
            },
          },
          {
            id: 'member-3',
            agentId: 'member-id',
            role: 'member',
            joinedAt: new Date('2024-01-03'),
            agent: {
              id: 'member-id',
              name: 'Member',
              description: 'Member Desc',
              status: 'active',
              trustScore: 80,
            },
          },
        ],
      };

      mockPrismaService.teamMember.findUnique.mockResolvedValue(mockMember);
      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);

      const result = await service.getTeamDetails('team-id', 'requester-id');

      expect(result.members[0].role).toBe('owner');
      expect(result.members[1].role).toBe('admin');
      expect(result.members[2].role).toBe('member');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database errors gracefully in createTeam', async () => {
      mockPrismaService.team.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.createTeam('owner-id', { name: 'Test Team' }),
      ).rejects.toThrow();
    });

    it('should handle database errors gracefully in addMember', async () => {
      mockPrismaService.team.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.addMember('team-id', 'owner-id', { agentId: 'new-member-id' }),
      ).rejects.toThrow();
    });

    it('should handle database errors gracefully in removeMember', async () => {
      mockPrismaService.team.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.removeMember('team-id', 'owner-id', 'member-id'),
      ).rejects.toThrow();
    });

    it('should handle database errors gracefully in updateMemberRole', async () => {
      mockPrismaService.team.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.updateMemberRole('team-id', 'owner-id', 'member-id', {
          role: 'admin',
        }),
      ).rejects.toThrow();
    });

    it('should handle database errors gracefully in getTeamDetails', async () => {
      mockPrismaService.teamMember.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.getTeamDetails('team-id', 'requester-id'),
      ).rejects.toThrow();
    });
  });

  describe('Role Hierarchy', () => {
    it('should respect role hierarchy: owner > admin > member', async () => {
      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      // Admin cannot remove another admin
      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'admin-id-1',
        role: 'admin',
      };

      const mockTarget = {
        id: 'member-2',
        teamId: 'team-id',
        agentId: 'admin-id-2',
        role: 'admin',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockTarget);

      await expect(
        service.removeMember('team-id', 'admin-id-1', 'admin-id-2'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow owner to update any role', async () => {
      const updateRoleDto = {
        role: 'owner' as const,
      };

      const mockTeam = {
        id: 'team-id',
        name: 'Test Team',
      };

      const mockRequester = {
        id: 'member-1',
        teamId: 'team-id',
        agentId: 'owner-id',
        role: 'owner',
      };

      const mockTarget = {
        id: 'member-2',
        teamId: 'team-id',
        agentId: 'admin-id',
        role: 'admin',
        updatedAt: new Date(),
        agent: {
          id: 'admin-id',
          name: 'Admin',
          description: 'Desc',
          status: 'active',
        },
      };

      const mockUpdatedTarget = {
        ...mockTarget,
        role: 'owner',
      };

      mockPrismaService.team.findUnique.mockResolvedValue(mockTeam);
      mockPrismaService.teamMember.findUnique
        .mockResolvedValueOnce(mockRequester)
        .mockResolvedValueOnce(mockTarget);
      mockPrismaService.teamMember.update.mockResolvedValue(mockUpdatedTarget);

      const result = await service.updateMemberRole(
        'team-id',
        'owner-id',
        'admin-id',
        updateRoleDto,
      );

      expect(result.member.role).toBe('owner');
    });
  });
});
