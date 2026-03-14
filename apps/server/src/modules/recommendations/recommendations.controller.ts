import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import {
  AgentRecommendationRequestDto,
  TaskRecommendationRequestDto,
  PricingSuggestionRequestDto,
  RecommendationFeedbackDto,
} from './dto/recommendations.dto';

@Controller('api/v1/recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  // ============================================
  // Agent Recommendations
  // ============================================

  @Post('agents')
  @HttpCode(HttpStatus.OK)
  async getAgentRecommendations(@Body() dto: AgentRecommendationRequestDto) {
    return this.recommendationsService.recommendAgents(dto);
  }

  @Get('agents/:taskId')
  async getAgentRecommendationsForTask(@Param('taskId') taskId: string) {
    return this.recommendationsService.recommendAgents({
      taskId,
      limit: 10,
    });
  }

  // ============================================
  // Task Recommendations
  // ============================================

  @Post('tasks')
  @HttpCode(HttpStatus.OK)
  async getTaskRecommendations(@Body() dto: TaskRecommendationRequestDto) {
    return this.recommendationsService.recommendTasks(dto);
  }

  @Get('tasks/:agentId')
  async getTaskRecommendationsForAgent(@Param('agentId') agentId: string) {
    return this.recommendationsService.recommendTasks({
      agentId,
      limit: 20,
    });
  }

  // ============================================
  // Pricing Suggestions
  // ============================================

  @Post('pricing')
  @HttpCode(HttpStatus.OK)
  async getPricingSuggestion(@Body() dto: PricingSuggestionRequestDto) {
    return this.recommendationsService.suggestPrice(dto);
  }

  @Get('pricing/history/:category')
  async getPricingHistory(@Param('category') category: string) {
    const history = await this.recommendationsService.getHistoricalPrices(
      category,
    );
    return history;
  }

  // ============================================
  // Feedback
  // ============================================

  @Post('feedback')
  @HttpCode(HttpStatus.OK)
  async submitFeedback(@Body() dto: RecommendationFeedbackDto) {
    await this.recommendationsService.recordFeedback(dto);
    return { success: true };
  }

  // ============================================
  // Performance Tracking (Internal Use)
  // ============================================

  @Post('update-performance/:agentId')
  @HttpCode(HttpStatus.OK)
  async updateAgentPerformance(@Param('agentId') agentId: string) {
    await this.recommendationsService.updateAgentPerformance(agentId);
    return { success: true };
  }

  @Post('update-market-trends')
  @HttpCode(HttpStatus.OK)
  async updateMarketTrends() {
    await this.recommendationsService.updateMarketTrends();
    return { success: true };
  }
}
