import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateTeamDto, AddMemberDto, UpdateMemberRoleDto } from './dto';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建团队
   */
  async createTeam(ownerId: string, createTeamDto: CreateTeamDto) {
    // 创建团队
    const team = await this.prisma.team.create({
      data: {
        name: createTeamDto.name,
        description: createTeamDto.description,
        ownerId,
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

    // 将创建者添加为owner成员
    await this.prisma.teamMember.create({
      data: {
        teamId: team.id,
        agentId: ownerId,
        role: 'owner',
      },
    });

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      owner: team.owner,
      createdAt: team.createdAt,
      message: 'Team created successfully',
    };
  }

  /**
   * 获取我的团队列表
   */
  async getMyTeams(agentId: string) {
    const teams = await this.prisma.teamMember.findMany({
      where: { agentId },
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

    return {
      total: teams.length,
      teams: teams.map((tm) => ({
        id: tm.team.id,
        name: tm.team.name,
        description: tm.team.description,
        owner: tm.team.owner,
        myRole: tm.role,
        memberCount: tm.team.members.length,
        createdAt: tm.team.createdAt,
        joinedAt: tm.joinedAt,
      })),
    };
  }

  /**
   * 添加成员
   */
  async addMember(
    teamId: string,
    requesterId: string,
    addMemberDto: AddMemberDto,
  ) {
    // 检查团队是否存在
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // 检查请求者权限（只有owner和admin可以添加成员）
    const requesterMember = await this.prisma.teamMember.findUnique({
      where: {
        teamId_agentId: {
          teamId,
          agentId: requesterId,
        },
      },
    });

    if (!requesterMember || !['owner', 'admin'].includes(requesterMember.role)) {
      throw new ForbiddenException('Only team owners and admins can add members');
    }

    // 检查成员是否已存在
    const existingMember = await this.prisma.teamMember.findUnique({
      where: {
        teamId_agentId: {
          teamId,
          agentId: addMemberDto.agentId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictException('Agent is already a team member');
    }

    // 检查被添加的agent是否存在
    const agent = await this.prisma.agent.findUnique({
      where: { id: addMemberDto.agentId },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // 添加成员
    const member = await this.prisma.teamMember.create({
      data: {
        teamId,
        agentId: addMemberDto.agentId,
        role: addMemberDto.role || 'member',
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

    return {
      message: 'Member added successfully',
      member: {
        id: member.id,
        agent: member.agent,
        role: member.role,
        joinedAt: member.joinedAt,
      },
    };
  }

  /**
   * 移除成员
   */
  async removeMember(
    teamId: string,
    requesterId: string,
    agentId: string,
  ) {
    // 检查团队是否存在
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // 检查请求者权限
    const requesterMember = await this.prisma.teamMember.findUnique({
      where: {
        teamId_agentId: {
          teamId,
          agentId: requesterId,
        },
      },
    });

    // Owner可以移除任何人，Admin可以移除member，member只能移除自己
    if (!requesterMember) {
      throw new ForbiddenException('You are not a team member');
    }

    const targetMember = await this.prisma.teamMember.findUnique({
      where: {
        teamId_agentId: {
          teamId,
          agentId,
        },
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found in team');
    }

    // 权限检查
    if (requesterMember.role === 'owner') {
      // Owner can remove anyone except themselves if they're the only owner
      if (agentId === requesterId) {
        const ownerCount = await this.prisma.teamMember.count({
          where: {
            teamId,
            role: 'owner',
          },
        });
        if (ownerCount === 1) {
          throw new ForbiddenException('Cannot remove the last owner. Transfer ownership first or delete the team.');
        }
      }
    } else if (requesterMember.role === 'admin') {
      // Admin can only remove members
      if (targetMember.role !== 'member') {
        throw new ForbiddenException('Admins can only remove regular members');
      }
    } else {
      // Members can only remove themselves
      if (agentId !== requesterId) {
        throw new ForbiddenException('Members can only remove themselves');
      }
    }

    // 不能移除团队所有者（除非是owner自己操作且还有其他owner）
    if (targetMember.role === 'owner' && requesterMember.role !== 'owner') {
      throw new ForbiddenException('Cannot remove team owner');
    }

    // 移除成员
    await this.prisma.teamMember.delete({
      where: { id: targetMember.id },
    });

    return {
      message: 'Member removed successfully',
    };
  }

  /**
   * 更新成员角色
   */
  async updateMemberRole(
    teamId: string,
    requesterId: string,
    agentId: string,
    updateRoleDto: UpdateMemberRoleDto,
  ) {
    // 检查团队是否存在
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // 检查请求者权限（只有owner可以更改角色）
    const requesterMember = await this.prisma.teamMember.findUnique({
      where: {
        teamId_agentId: {
          teamId,
          agentId: requesterId,
        },
      },
    });

    if (!requesterMember || requesterMember.role !== 'owner') {
      throw new ForbiddenException('Only team owners can update member roles');
    }

    // 检查目标成员
    const targetMember = await this.prisma.teamMember.findUnique({
      where: {
        teamId_agentId: {
          teamId,
          agentId,
        },
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found in team');
    }

    // 如果要将某个成员设为owner，确保至少有一个owner
    if (updateRoleDto.role === 'owner' && targetMember.role === 'owner') {
      throw new ConflictException('Member is already an owner');
    }

    // 更新角色
    const updated = await this.prisma.teamMember.update({
      where: { id: targetMember.id },
      data: { role: updateRoleDto.role },
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

    return {
      message: 'Member role updated successfully',
      member: {
        id: updated.id,
        agent: updated.agent,
        role: updated.role,
        updatedAt: updated.updatedAt,
      },
    };
  }

  /**
   * 获取团队详情
   */
  async getTeamDetails(teamId: string, requesterId: string) {
    // 检查是否是团队成员
    const member = await this.prisma.teamMember.findUnique({
      where: {
        teamId_agentId: {
          teamId,
          agentId: requesterId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a team member');
    }

    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
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
            { role: 'asc' }, // owner, admin, member
            { joinedAt: 'asc' },
          ],
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      owner: team.owner,
      myRole: member.role,
      members: team.members.map((m) => ({
        id: m.id,
        agent: m.agent,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      memberCount: team.members.length,
      createdAt: team.createdAt,
    };
  }
}
