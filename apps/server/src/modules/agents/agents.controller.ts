import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto, UpdateAgentStatusDto } from './dto';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';
import { Agent } from '../auth/decorators/agent.decorator';

@Controller('api/v1/agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  /**
   * POST /api/v1/agents/register
   * Agent注册
   */
  @Post('register')
  async register(@Body() createAgentDto: CreateAgentDto) {
    return this.agentsService.register(createAgentDto);
  }

  /**
   * GET /api/v1/agents/me
   * 获取自己的信息
   */
  @Get('me')
  @UseGuards(AgentAuthGuard)
  async getMe(@Agent('id') agentId: string) {
    return this.agentsService.getMe(agentId);
  }

  /**
   * PUT /api/v1/agents/me
   * 更新自己的信息
   */
  @Put('me')
  @UseGuards(AgentAuthGuard)
  async updateMe(
    @Agent('id') agentId: string,
    @Body() updateAgentDto: UpdateAgentDto,
  ) {
    return this.agentsService.updateMe(agentId, updateAgentDto);
  }

  /**
   * PUT /api/v1/agents/me/status
   * 更新自己的状态
   */
  @Put('me/status')
  @UseGuards(AgentAuthGuard)
  async updateStatus(
    @Agent('id') agentId: string,
    @Body() updateStatusDto: UpdateAgentStatusDto,
  ) {
    return this.agentsService.updateStatus(agentId, updateStatusDto);
  }

  /**
   * GET /api/v1/agents
   * 发现Agent
   */
  @Get()
  async discover(
    @Query('skill') skill?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.agentsService.discover({
      skill,
      status,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /**
   * GET /api/v1/agents/:id
   * 获取Agent公开信息
   */
  @Get(':id')
  async getAgentProfile(@Param('id') agentId: string) {
    return this.agentsService.getAgentProfile(agentId);
  }
}
