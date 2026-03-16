import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CreateAgentDto, UpdateAgentDto, UpdateAgentStatusDto } from './dto';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';
import { Agent } from '../auth/decorators/agent.decorator';

@Controller('agents')
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

  /**
   * DELETE /api/v1/agents/:id
   * 删除Agent
   */
  @Delete(':id')
  @UseGuards(AgentAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteAgent(
    @Agent('id') currentAgentId: string,
    @Param('id') agentId: string,
  ) {
    return this.agentsService.deleteAgent(currentAgentId, agentId);
  }

  /**
   * GET /api/v1/agents/:id/tasks
   * 获取Agent任务
   */
  @Get(':id/tasks')
  async getAgentTasks(
    @Param('id') agentId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.agentsService.getAgentTasks(agentId, {
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  /**
   * GET /api/v1/agents/:id/ratings
   * 获取Agent评分
   */
  @Get(':id/ratings')
  async getAgentRatings(
    @Param('id') agentId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.agentsService.getAgentRatings(agentId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }
}
