import {
  Controller,
  Get,
  Post,
  Delete,
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
  ApiQuery,
} from '@nestjs/swagger';
import { RatingsService } from './ratings.service';
import { CreateRatingDto, RatingQueryDto } from './dto/ratings.dto';

@ApiTags('Ratings')
@ApiBearerAuth()
@Controller('api/v1')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  // ============================================
  // Rating Endpoints
  // ============================================

  @Post('ratings')
  @ApiOperation({ summary: '提交评分' })
  @ApiResponse({ status: 201, description: '创建成功' })
  @ApiResponse({ status: 400, description: '参数错误或重复评分' })
  @ApiResponse({ status: 404, description: 'Agent不存在' })
  async createRating(@Body() dto: CreateRatingDto) {
    return this.ratingsService.createRating(dto);
  }

  @Get('ratings/statistics')
  @ApiOperation({ summary: '获取全局评分统计' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getRatingStatistics() {
    return this.ratingsService.getRatingStatistics();
  }

  @Get('ratings/:id')
  @ApiOperation({ summary: '获取评分详情' })
  @ApiParam({ name: 'id', description: '评分ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '评分不存在' })
  async getRatingById(@Param('id', ParseUUIDPipe) id: string) {
    // This would need to be implemented in the service
    return { id };
  }

  @Delete('ratings/:id')
  @ApiOperation({ summary: '删除评分' })
  @ApiParam({ name: 'id', description: '评分ID' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '评分不存在' })
  async deleteRating(@Param('id', ParseUUIDPipe) id: string) {
    return this.ratingsService.deleteRating(id);
  }

  // ============================================
  // Agent Rating Endpoints
  // ============================================

  @Get('agents/:id/ratings')
  @ApiOperation({ summary: '获取Agent的评分列表' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAgentRatings(
    @Param('id', ParseUUIDPipe) agentId: string,
    @Query() query: RatingQueryDto,
  ) {
    return this.ratingsService.getAgentRatings(agentId, query);
  }

  @Get('agents/:id/rating-summary')
  @ApiOperation({ summary: '获取Agent评分汇总' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: 'Agent不存在' })
  async getAgentRatingSummary(@Param('id', ParseUUIDPipe) agentId: string) {
    return this.ratingsService.getAgentRatingSummary(agentId);
  }

  @Get('agents/:id/rating-history')
  @ApiOperation({ summary: '获取Agent评分历史趋势' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiQuery({ name: 'days', required: false, description: '查询天数，默认30天' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAgentRatingHistory(
    @Param('id', ParseUUIDPipe) agentId: string,
    @Query('days') days?: number,
  ) {
    return this.ratingsService.getRatingHistory(agentId, days || 30);
  }

  @Get('agents/:id/rating-anomalies')
  @ApiOperation({ summary: '检测Agent异常评分' })
  @ApiParam({ name: 'id', description: 'Agent ID' })
  @ApiResponse({ status: 200, description: '检测成功' })
  async detectAgentRatingAnomalies(
    @Param('id', ParseUUIDPipe) agentId: string,
  ) {
    return this.ratingsService.detectAnomalousRatings(agentId);
  }

  // ============================================
  // Task Rating Endpoints
  // ============================================

  @Get('tasks/:id/ratings')
  @ApiOperation({ summary: '获取任务相关评分' })
  @ApiParam({ name: 'id', description: '任务ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTaskRatings(@Param('id', ParseUUIDPipe) taskId: string) {
    return this.ratingsService.getTaskRatings(taskId);
  }
}
