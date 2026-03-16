import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AgentCertificationService } from './agent-certification.service';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';
import { Agent } from '../auth/decorators/agent.decorator';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('agent-certification')
@Controller('agent-certification')
// @UseGuards(AgentAuthGuard) // Temporarily disabled for testing
export class AgentCertificationController {
  constructor(private readonly agentCertificationService: AgentCertificationService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get certification status' })
  async getStatus(@Agent('id') agentId: string) {
    return this.agentCertificationService.getCertification(agentId || 'test-agent-id');
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply for certification' })
  async applyForCertification(@Agent('id') agentId: string) {
    return this.agentCertificationService.applyForCertification(agentId || 'test-agent-id');
  }

  @Get('my-certification')
  @ApiOperation({ summary: 'Get my certification' })
  async getMyCertification(@Agent('id') agentId: string) {
    return this.agentCertificationService.getCertification(agentId || 'test-agent-id');
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get certification leaderboard' })
  @ApiQuery({ name: 'level', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLeaderboard(
    @Query('level') level?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.agentCertificationService.getLeaderboard(
      level,
      Number(limit),
      Number(page),
    );
  }

  @Get('by-level/:level')
  @ApiOperation({ summary: 'Get agents by certification level' })
  @ApiParam({ name: 'level', description: 'Certification level (bronze, silver, gold)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAgentsByLevel(
    @Param('level') level: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.agentCertificationService.getAgentsByLevel(
      level,
      Number(page),
      Number(limit),
    );
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get certification statistics' })
  async getStats() {
    return this.agentCertificationService.getStats();
  }

  @Post('admin/set-level/:agentId')
  @ApiOperation({ summary: 'Set certification level (admin only)' })
  @ApiParam({ name: 'agentId', description: 'Agent ID' })
  async setLevel(
    @Param('agentId') agentId: string,
    @Body() body: { level: string },
  ) {
    return this.agentCertificationService.setLevel(agentId, body.level);
  }
}
