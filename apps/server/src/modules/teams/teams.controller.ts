import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto, AddMemberDto, UpdateMemberRoleDto } from './dto';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';
import { Agent } from '../auth/decorators/agent.decorator';

@Controller('teams')
@UseGuards(AgentAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  /**
   * POST /api/v1/teams
   * 创建团队
   */
  @Post()
  async createTeam(
    @Agent('id') agentId: string,
    @Body() createTeamDto: CreateTeamDto,
  ) {
    return this.teamsService.createTeam(agentId, createTeamDto);
  }

  /**
   * GET /api/v1/teams
   * 获取我的团队列表
   */
  @Get()
  async getMyTeams(@Agent('id') agentId: string) {
    return this.teamsService.getMyTeams(agentId);
  }

  /**
   * GET /api/v1/teams/:id
   * 获取团队详情
   */
  @Get(':id')
  async getTeamDetails(
    @Param('id') teamId: string,
    @Agent('id') agentId: string,
  ) {
    return this.teamsService.getTeamDetails(teamId, agentId);
  }

  /**
   * POST /api/v1/teams/:id/members
   * 添加成员
   */
  @Post(':id/members')
  async addMember(
    @Param('id') teamId: string,
    @Agent('id') agentId: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return this.teamsService.addMember(teamId, agentId, addMemberDto);
  }

  /**
   * DELETE /api/v1/teams/:id/members/:agentId
   * 移除成员
   */
  @Delete(':id/members/:agentId')
  async removeMember(
    @Param('id') teamId: string,
    @Agent('id') requesterId: string,
    @Param('agentId') agentId: string,
  ) {
    return this.teamsService.removeMember(teamId, requesterId, agentId);
  }

  /**
   * PATCH /api/v1/teams/:id/members/:agentId
   * 更新成员角色
   */
  @Patch(':id/members/:agentId')
  async updateMemberRole(
    @Param('id') teamId: string,
    @Agent('id') requesterId: string,
    @Param('agentId') agentId: string,
    @Body() updateRoleDto: UpdateMemberRoleDto,
  ) {
    return this.teamsService.updateMemberRole(teamId, requesterId, agentId, updateRoleDto);
  }
}
