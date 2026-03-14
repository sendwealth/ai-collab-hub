import { Test, TestingModule } from '@nestjs/testing';
import { TeamsController } from './teams.controller';
import { TeamsService } from './teams.service';
import { CreateTeamDto, AddMemberDto, UpdateMemberRoleDto } from './dto';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';

describe('TeamsController', () => {
  let controller: TeamsController;
  let service: TeamsService;

  const mockTeamsService = {
    createTeam: jest.fn(),
    getMyTeams: jest.fn(),
    getTeamDetails: jest.fn(),
    addMember: jest.fn(),
    removeMember: jest.fn(),
    updateMemberRole: jest.fn(),
  };

  const mockAuthGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamsController],
      providers: [
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
        {
          provide: AgentAuthGuard,
          useValue: mockAuthGuard,
        },
      ],
    })
      .overrideGuard(AgentAuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<TeamsController>(TeamsController);
    service = module.get<TeamsService>(TeamsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTeam', () => {
    it('should create a team successfully', async () => {
      const createTeamDto: CreateTeamDto = {
        name: 'Test Team',
        description: 'Test Description',
      };

      const expectedResult = {
        id: 'team-id',
        name: 'Test Team',
        description: 'Test Description',
        owner: {
          id: 'agent-id',
          name: 'Agent',
          description: 'Agent Desc',
        },
        createdAt: new Date(),
        message: 'Team created successfully',
      };

      mockTeamsService.createTeam.mockResolvedValue(expectedResult);

      const result = await controller.createTeam('agent-id', createTeamDto);

      expect(result).toEqual(expectedResult);
      expect(service.createTeam).toHaveBeenCalledWith('agent-id', createTeamDto);
    });

    it('should create team without description', async () => {
      const createTeamDto: CreateTeamDto = {
        name: 'Test Team',
      };

      const expectedResult = {
        id: 'team-id',
        name: 'Test Team',
        description: undefined,
        owner: {
          id: 'agent-id',
          name: 'Agent',
          description: 'Agent Desc',
        },
        createdAt: new Date(),
        message: 'Team created successfully',
      };

      mockTeamsService.createTeam.mockResolvedValue(expectedResult);

      const result = await controller.createTeam('agent-id', createTeamDto);

      expect(result).toEqual(expectedResult);
      expect(service.createTeam).toHaveBeenCalledWith('agent-id', createTeamDto);
    });

    it('should call service with correct agent ID from decorator', async () => {
      const createTeamDto: CreateTeamDto = {
        name: 'Test Team',
        description: 'Test Description',
      };

      const agentId = 'test-agent-id';

      mockTeamsService.createTeam.mockResolvedValue({});

      await controller.createTeam(agentId, createTeamDto);

      expect(service.createTeam).toHaveBeenCalledWith(agentId, createTeamDto);
    });
  });

  describe('getMyTeams', () => {
    it('should return teams for agent', async () => {
      const expectedResult = {
        total: 2,
        teams: [
          {
            id: 'team-1',
            name: 'Team 1',
            description: 'Description 1',
            owner: {
              id: 'owner-1',
              name: 'Owner 1',
              description: 'Owner Desc 1',
            },
            myRole: 'owner',
            memberCount: 3,
            createdAt: new Date(),
            joinedAt: new Date(),
          },
          {
            id: 'team-2',
            name: 'Team 2',
            description: 'Description 2',
            owner: {
              id: 'owner-2',
              name: 'Owner 2',
              description: 'Owner Desc 2',
            },
            myRole: 'member',
            memberCount: 5,
            createdAt: new Date(),
            joinedAt: new Date(),
          },
        ],
      };

      mockTeamsService.getMyTeams.mockResolvedValue(expectedResult);

      const result = await controller.getMyTeams('agent-id');

      expect(result).toEqual(expectedResult);
      expect(service.getMyTeams).toHaveBeenCalledWith('agent-id');
    });

    it('should return empty array if no teams', async () => {
      const expectedResult = {
        total: 0,
        teams: [],
      };

      mockTeamsService.getMyTeams.mockResolvedValue(expectedResult);

      const result = await controller.getMyTeams('agent-id');

      expect(result.total).toBe(0);
      expect(result.teams).toHaveLength(0);
      expect(service.getMyTeams).toHaveBeenCalledWith('agent-id');
    });
  });

  describe('getTeamDetails', () => {
    it('should return team details', async () => {
      const expectedResult = {
        id: 'team-id',
        name: 'Test Team',
        description: 'Test Description',
        owner: {
          id: 'owner-id',
          name: 'Owner',
          description: 'Owner Desc',
        },
        myRole: 'admin',
        members: [
          {
            id: 'member-1',
            agent: {
              id: 'owner-id',
              name: 'Owner',
              description: 'Owner Desc',
              status: 'active',
            },
            role: 'owner',
            joinedAt: new Date(),
          },
          {
            id: 'member-2',
            agent: {
              id: 'agent-id',
              name: 'Agent',
              description: 'Agent Desc',
              status: 'active',
            },
            role: 'admin',
            joinedAt: new Date(),
          },
        ],
        memberCount: 2,
        createdAt: new Date(),
      };

      mockTeamsService.getTeamDetails.mockResolvedValue(expectedResult);

      const result = await controller.getTeamDetails('team-id', 'agent-id');

      expect(result).toEqual(expectedResult);
      expect(service.getTeamDetails).toHaveBeenCalledWith('team-id', 'agent-id');
    });

    it('should call service with correct team ID and agent ID', async () => {
      const teamId = 'test-team-id';
      const agentId = 'test-agent-id';

      mockTeamsService.getTeamDetails.mockResolvedValue({});

      await controller.getTeamDetails(teamId, agentId);

      expect(service.getTeamDetails).toHaveBeenCalledWith(teamId, agentId);
    });
  });

  describe('addMember', () => {
    it('should add member successfully', async () => {
      const addMemberDto: AddMemberDto = {
        agentId: 'new-member-id',
        role: 'member',
      };

      const expectedResult = {
        message: 'Member added successfully',
        member: {
          id: 'member-id',
          agent: {
            id: 'new-member-id',
            name: 'New Member',
            description: 'New Member Desc',
            status: 'active',
          },
          role: 'member',
          joinedAt: new Date(),
        },
      };

      mockTeamsService.addMember.mockResolvedValue(expectedResult);

      const result = await controller.addMember(
        'team-id',
        'owner-id',
        addMemberDto,
      );

      expect(result).toEqual(expectedResult);
      expect(service.addMember).toHaveBeenCalledWith(
        'team-id',
        'owner-id',
        addMemberDto,
      );
    });

    it('should add member with default role if not specified', async () => {
      const addMemberDto: AddMemberDto = {
        agentId: 'new-member-id',
      };

      const expectedResult = {
        message: 'Member added successfully',
        member: {
          id: 'member-id',
          agent: {
            id: 'new-member-id',
            name: 'New Member',
            description: 'New Member Desc',
            status: 'active',
          },
          role: 'member',
          joinedAt: new Date(),
        },
      };

      mockTeamsService.addMember.mockResolvedValue(expectedResult);

      const result = await controller.addMember(
        'team-id',
        'owner-id',
        addMemberDto,
      );

      expect(result).toEqual(expectedResult);
      expect(service.addMember).toHaveBeenCalledWith(
        'team-id',
        'owner-id',
        addMemberDto,
      );
    });

    it('should add admin role member', async () => {
      const addMemberDto: AddMemberDto = {
        agentId: 'new-admin-id',
        role: 'admin',
      };

      const expectedResult = {
        message: 'Member added successfully',
        member: {
          id: 'member-id',
          agent: {
            id: 'new-admin-id',
            name: 'New Admin',
            description: 'New Admin Desc',
            status: 'active',
          },
          role: 'admin',
          joinedAt: new Date(),
        },
      };

      mockTeamsService.addMember.mockResolvedValue(expectedResult);

      const result = await controller.addMember(
        'team-id',
        'owner-id',
        addMemberDto,
      );

      expect(result.member.role).toBe('admin');
      expect(service.addMember).toHaveBeenCalledWith(
        'team-id',
        'owner-id',
        addMemberDto,
      );
    });

    it('should call service with correct parameters', async () => {
      const teamId = 'test-team-id';
      const agentId = 'test-agent-id';
      const addMemberDto: AddMemberDto = {
        agentId: 'new-member-id',
        role: 'member',
      };

      mockTeamsService.addMember.mockResolvedValue({});

      await controller.addMember(teamId, agentId, addMemberDto);

      expect(service.addMember).toHaveBeenCalledWith(teamId, agentId, addMemberDto);
    });
  });

  describe('removeMember', () => {
    it('should remove member successfully', async () => {
      const expectedResult = {
        message: 'Member removed successfully',
      };

      mockTeamsService.removeMember.mockResolvedValue(expectedResult);

      const result = await controller.removeMember(
        'team-id',
        'owner-id',
        'member-id',
      );

      expect(result).toEqual(expectedResult);
      expect(service.removeMember).toHaveBeenCalledWith(
        'team-id',
        'owner-id',
        'member-id',
      );
    });

    it('should call service with correct parameters', async () => {
      const teamId = 'test-team-id';
      const requesterId = 'test-requester-id';
      const agentId = 'test-agent-id';

      mockTeamsService.removeMember.mockResolvedValue({});

      await controller.removeMember(teamId, requesterId, agentId);

      expect(service.removeMember).toHaveBeenCalledWith(
        teamId,
        requesterId,
        agentId,
      );
    });

    it('should allow member to remove themselves', async () => {
      const expectedResult = {
        message: 'Member removed successfully',
      };

      mockTeamsService.removeMember.mockResolvedValue(expectedResult);

      const result = await controller.removeMember(
        'team-id',
        'member-id',
        'member-id',
      );

      expect(result.message).toBe('Member removed successfully');
      expect(service.removeMember).toHaveBeenCalledWith(
        'team-id',
        'member-id',
        'member-id',
      );
    });
  });

  describe('updateMemberRole', () => {
    it('should update member role successfully', async () => {
      const updateRoleDto: UpdateMemberRoleDto = {
        role: 'admin',
      };

      const expectedResult = {
        message: 'Member role updated successfully',
        member: {
          id: 'member-id',
          agent: {
            id: 'agent-id',
            name: 'Agent',
            description: 'Agent Desc',
            status: 'active',
          },
          role: 'admin',
          updatedAt: new Date(),
        },
      };

      mockTeamsService.updateMemberRole.mockResolvedValue(expectedResult);

      const result = await controller.updateMemberRole(
        'team-id',
        'owner-id',
        'member-id',
        updateRoleDto,
      );

      expect(result).toEqual(expectedResult);
      expect(service.updateMemberRole).toHaveBeenCalledWith(
        'team-id',
        'owner-id',
        'member-id',
        updateRoleDto,
      );
    });

    it('should promote member to owner', async () => {
      const updateRoleDto: UpdateMemberRoleDto = {
        role: 'owner',
      };

      const expectedResult = {
        message: 'Member role updated successfully',
        member: {
          id: 'member-id',
          agent: {
            id: 'agent-id',
            name: 'Agent',
            description: 'Agent Desc',
            status: 'active',
          },
          role: 'owner',
          updatedAt: new Date(),
        },
      };

      mockTeamsService.updateMemberRole.mockResolvedValue(expectedResult);

      const result = await controller.updateMemberRole(
        'team-id',
        'owner-id',
        'member-id',
        updateRoleDto,
      );

      expect(result.member.role).toBe('owner');
      expect(service.updateMemberRole).toHaveBeenCalledWith(
        'team-id',
        'owner-id',
        'member-id',
        updateRoleDto,
      );
    });

    it('should demote admin to member', async () => {
      const updateRoleDto: UpdateMemberRoleDto = {
        role: 'member',
      };

      const expectedResult = {
        message: 'Member role updated successfully',
        member: {
          id: 'member-id',
          agent: {
            id: 'agent-id',
            name: 'Agent',
            description: 'Agent Desc',
            status: 'active',
          },
          role: 'member',
          updatedAt: new Date(),
        },
      };

      mockTeamsService.updateMemberRole.mockResolvedValue(expectedResult);

      const result = await controller.updateMemberRole(
        'team-id',
        'owner-id',
        'admin-id',
        updateRoleDto,
      );

      expect(result.member.role).toBe('member');
      expect(service.updateMemberRole).toHaveBeenCalledWith(
        'team-id',
        'owner-id',
        'admin-id',
        updateRoleDto,
      );
    });

    it('should call service with correct parameters', async () => {
      const teamId = 'test-team-id';
      const requesterId = 'test-requester-id';
      const agentId = 'test-agent-id';
      const updateRoleDto: UpdateMemberRoleDto = {
        role: 'admin',
      };

      mockTeamsService.updateMemberRole.mockResolvedValue({});

      await controller.updateMemberRole(teamId, requesterId, agentId, updateRoleDto);

      expect(service.updateMemberRole).toHaveBeenCalledWith(
        teamId,
        requesterId,
        agentId,
        updateRoleDto,
      );
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors in createTeam', async () => {
      const createTeamDto: CreateTeamDto = {
        name: 'Test Team',
        description: 'Test Description',
      };

      const error = new Error('Service error');
      mockTeamsService.createTeam.mockRejectedValue(error);

      await expect(
        controller.createTeam('agent-id', createTeamDto),
      ).rejects.toThrow(error);
    });

    it('should propagate service errors in getMyTeams', async () => {
      const error = new Error('Service error');
      mockTeamsService.getMyTeams.mockRejectedValue(error);

      await expect(controller.getMyTeams('agent-id')).rejects.toThrow(error);
    });

    it('should propagate service errors in getTeamDetails', async () => {
      const error = new Error('Service error');
      mockTeamsService.getTeamDetails.mockRejectedValue(error);

      await expect(
        controller.getTeamDetails('team-id', 'agent-id'),
      ).rejects.toThrow(error);
    });

    it('should propagate service errors in addMember', async () => {
      const addMemberDto: AddMemberDto = {
        agentId: 'new-member-id',
        role: 'member',
      };

      const error = new Error('Service error');
      mockTeamsService.addMember.mockRejectedValue(error);

      await expect(
        controller.addMember('team-id', 'owner-id', addMemberDto),
      ).rejects.toThrow(error);
    });

    it('should propagate service errors in removeMember', async () => {
      const error = new Error('Service error');
      mockTeamsService.removeMember.mockRejectedValue(error);

      await expect(
        controller.removeMember('team-id', 'owner-id', 'member-id'),
      ).rejects.toThrow(error);
    });

    it('should propagate service errors in updateMemberRole', async () => {
      const updateRoleDto: UpdateMemberRoleDto = {
        role: 'admin',
      };

      const error = new Error('Service error');
      mockTeamsService.updateMemberRole.mockRejectedValue(error);

      await expect(
        controller.updateMemberRole('team-id', 'owner-id', 'member-id', updateRoleDto),
      ).rejects.toThrow(error);
    });
  });

  describe('Parameter Validation', () => {
    it('should pass team ID from path parameter', async () => {
      const teamId = 'specific-team-id';

      mockTeamsService.getTeamDetails.mockResolvedValue({});

      await controller.getTeamDetails(teamId, 'agent-id');

      expect(service.getTeamDetails).toHaveBeenCalledWith(
        teamId,
        expect.any(String),
      );
    });

    it('should pass agent ID from decorator', async () => {
      const agentId = 'specific-agent-id';

      mockTeamsService.getMyTeams.mockResolvedValue({});

      await controller.getMyTeams(agentId);

      expect(service.getMyTeams).toHaveBeenCalledWith(agentId);
    });

    it('should pass both team ID and agent ID for member operations', async () => {
      const teamId = 'team-123';
      const agentId = 'agent-456';

      mockTeamsService.removeMember.mockResolvedValue({});

      await controller.removeMember(teamId, agentId, 'member-id');

      expect(service.removeMember).toHaveBeenCalledWith(
        teamId,
        agentId,
        expect.any(String),
      );
    });

    it('should pass DTO objects correctly', async () => {
      const createTeamDto: CreateTeamDto = {
        name: 'Test Team',
        description: 'Test Description',
      };

      mockTeamsService.createTeam.mockResolvedValue({});

      await controller.createTeam('agent-id', createTeamDto);

      expect(service.createTeam).toHaveBeenCalledWith(
        expect.any(String),
        createTeamDto,
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete team lifecycle', async () => {
      const agentId = 'owner-id';
      const teamId = 'team-id';
      const memberId = 'member-id';

      // 1. Create team
      const createDto: CreateTeamDto = {
        name: 'Test Team',
        description: 'Test Description',
      };

      mockTeamsService.createTeam.mockResolvedValue({
        id: teamId,
        name: createDto.name,
        message: 'Team created successfully',
      });

      await controller.createTeam(agentId, createDto);
      expect(service.createTeam).toHaveBeenCalled();

      // 2. Add member
      const addMemberDto: AddMemberDto = {
        agentId: memberId,
        role: 'member',
      };

      mockTeamsService.addMember.mockResolvedValue({
        message: 'Member added successfully',
      });

      await controller.addMember(teamId, agentId, addMemberDto);
      expect(service.addMember).toHaveBeenCalled();

      // 3. Update role
      const updateRoleDto: UpdateMemberRoleDto = {
        role: 'admin',
      };

      mockTeamsService.updateMemberRole.mockResolvedValue({
        message: 'Member role updated successfully',
      });

      await controller.updateMemberRole(teamId, agentId, memberId, updateRoleDto);
      expect(service.updateMemberRole).toHaveBeenCalled();

      // 4. Remove member
      mockTeamsService.removeMember.mockResolvedValue({
        message: 'Member removed successfully',
      });

      await controller.removeMember(teamId, agentId, memberId);
      expect(service.removeMember).toHaveBeenCalled();
    });

    it('should handle multiple team operations', async () => {
      const agentId = 'agent-id';

      mockTeamsService.getMyTeams.mockResolvedValue({
        total: 3,
        teams: [
          { id: 'team-1', myRole: 'owner' },
          { id: 'team-2', myRole: 'admin' },
          { id: 'team-3', myRole: 'member' },
        ],
      });

      const result = await controller.getMyTeams(agentId);

      expect(result.total).toBe(3);
      expect(result.teams).toHaveLength(3);
    });
  });
});
