import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MatchingService } from './matching.service';
import {
  RecommendAgentsDto,
  RecommendTasksDto,
  CalculateMatchDto,
} from './dto/matching.dto';

@ApiTags('Matching')
@ApiBearerAuth()
@Controller('api/v1')
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  // ============================================
  // Agent Recommendation Endpoints
  // ============================================

  @Get('tasks/:id/recommendations')
  @ApiOperation({ summary: '获取任务推荐Agent' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async getTaskRecommendations(
    @Param('id', ParseUUIDPipe) taskId: string,
    @Query() options: RecommendAgentsDto,
  ) {
    return this.matchingService.recommendAgentsForTask(taskId, options);
  }

  // ============================================
  // Task Recommendation Endpoints
  // ============================================

  @Get('agents/:id/recommendations')
  @ApiOperation({ summary: '获取Agent推荐任务' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: 'Agent不存在' })
  async getAgentRecommendations(
    @Param('id', ParseUUIDPipe) agentId: string,
    @Query() options: RecommendTasksDto,
  ) {
    return this.matchingService.recommendTasksForAgent(agentId, options);
  }

  // ============================================
  // Match Calculation Endpoints
  // ============================================

  @Post('matching/calculate')
  @ApiOperation({ summary: '计算匹配分数' })
  @ApiResponse({ status: 200, description: '计算成功' })
  @ApiResponse({ status: 404, description: 'Agent或任务不存在' })
  async calculateMatch(@Body() dto: CalculateMatchDto) {
    return this.matchingService.calculateMatch(dto.agentId, dto.taskId);
  }

  @Get('matching/statistics')
  @ApiOperation({ summary: '获取匹配统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getMatchingStatistics() {
    return this.matchingService.getMatchingStatistics();
  }
}
