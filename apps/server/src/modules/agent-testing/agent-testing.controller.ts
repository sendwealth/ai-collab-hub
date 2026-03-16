import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AgentTestingService } from './agent-testing.service';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';
import { Agent } from '../auth/decorators/agent.decorator';
import { StartTestDto, SubmitAnswersDto } from './dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

@ApiTags('agent-testing')
@Controller('agent-testing')
// @UseGuards(AgentAuthGuard) // Temporarily disabled for testing
export class AgentTestingController {
  constructor(private readonly agentTestingService: AgentTestingService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new test attempt' })
  async startTest(@Agent('id') agentId: string, @Body() startTestDto: StartTestDto) {
    return this.agentTestingService.startTest(agentId || 'test-agent-id', startTestDto);
  }

  @Post('submit/:attemptId')
  @ApiOperation({ summary: 'Submit answers for a test attempt' })
  @ApiParam({ name: 'attemptId', description: 'Test attempt ID' })
  async submitAnswers(
    @Agent('id') agentId: string,
    @Param('attemptId') attemptId: string,
    @Body() submitAnswersDto: SubmitAnswersDto,
  ) {
    return this.agentTestingService.submitAnswers(agentId || 'test-agent-id', attemptId, submitAnswersDto);
  }

  @Get('result/:attemptId')
  @ApiOperation({ summary: 'Get test result' })
  @ApiParam({ name: 'attemptId', description: 'Test attempt ID' })
  async getResult(@Agent('id') agentId: string, @Param('attemptId') attemptId: string) {
    return this.agentTestingService.getResult(agentId || 'test-agent-id', attemptId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get agent test history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getHistory(
    @Agent('id') agentId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.agentTestingService.getHistory(agentId || 'test-agent-id', Number(page), Number(limit));
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed initial test questions (for development)' })
  async seedQuestions() {
    return this.agentTestingService.seedQuestions();
  }
}
