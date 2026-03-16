import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { DepositService } from './deposit.service';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';
import { Agent } from '../auth/decorators/agent.decorator';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsEnum, Min } from 'class-validator';

class DepositDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  description?: string;
}

class DeductDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(['quality', 'timeout', 'other'])
  reason: 'quality' | 'timeout' | 'other';

  @IsOptional()
  taskId?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}

class RefundDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  reason: string;

  @IsOptional()
  taskId?: string;
}

class FreezeDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  taskId?: string;
}

@ApiTags('deposit')
@Controller('deposit')
// @UseGuards(AgentAuthGuard) // Temporarily disabled for testing
export class DepositController {
  constructor(private readonly depositService: DepositService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get deposit balance' })
  async getBalance(@Agent('id') agentId: string) {
    return this.depositService.getBalance(agentId || 'test-agent-id');
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit funds' })
  async deposit(@Agent('id') agentId: string, @Body() depositDto: DepositDto) {
    return this.depositService.deposit(agentId || 'test-agent-id', depositDto.amount, depositDto.description);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw funds' })
  async withdraw(@Agent('id') agentId: string, @Body() withdrawDto: DepositDto) {
    return this.depositService.withdraw(agentId || 'test-agent-id', withdrawDto.amount, withdrawDto.description);
  }

  @Post('deduct')
  @ApiOperation({ summary: 'Deduct funds' })
  async deduct(@Agent('id') agentId: string, @Body() deductDto: DeductDto) {
    return this.depositService.deduct(
      agentId || 'test-agent-id',
      deductDto.amount,
      deductDto.reason,
      deductDto.taskId,
      deductDto.metadata,
    );
  }

  @Post('refund')
  @ApiOperation({ summary: 'Refund funds' })
  async refund(@Agent('id') agentId: string, @Body() refundDto: RefundDto) {
    return this.depositService.refund(agentId || 'test-agent-id', refundDto.amount, refundDto.reason, refundDto.taskId);
  }

  @Post('freeze')
  @ApiOperation({ summary: 'Freeze deposit amount' })
  async freeze(@Agent('id') agentId: string, @Body() freezeDto: FreezeDto) {
    return this.depositService.freeze(agentId || 'test-agent-id', freezeDto.amount, freezeDto.taskId);
  }

  @Post('unfreeze')
  @ApiOperation({ summary: 'Unfreeze deposit amount' })
  async unfreeze(@Agent('id') agentId: string, @Body() freezeDto: FreezeDto) {
    return this.depositService.unfreeze(agentId || 'test-agent-id', freezeDto.amount, freezeDto.taskId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTransactionHistory(
    @Agent('id') agentId: string,
    @Query('type') type?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.depositService.getTransactionHistory(agentId || 'test-agent-id', {
      type,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get deposit statistics' })
  async getStats() {
    return this.depositService.getStats();
  }

  @Get('top-holders')
  @ApiOperation({ summary: 'Get top deposit holders' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopHolders(@Query('limit') limit = 50) {
    return this.depositService.getTopHolders(Number(limit));
  }

  @Get('calculate-quality-deduction')
  @ApiOperation({ summary: 'Calculate quality deduction amount' })
  @ApiQuery({ name: 'qualityScore', required: true, type: Number })
  @ApiQuery({ name: 'taskBudget', required: true, type: Number })
  async calculateQualityDeduction(
    @Query('qualityScore') qualityScore: number,
    @Query('taskBudget') taskBudget: number,
  ) {
    const amount = this.depositService.calculateQualityDeduction(qualityScore, taskBudget);
    return {
      qualityScore,
      taskBudget,
      deductionAmount: amount,
      remainingAmount: taskBudget - amount,
      deductionPercentage: (amount / taskBudget) * 100,
    };
  }

  @Get('calculate-timeout-deduction')
  @ApiOperation({ summary: 'Calculate timeout deduction amount' })
  @ApiQuery({ name: 'daysLate', required: true, type: Number })
  @ApiQuery({ name: 'taskBudget', required: true, type: Number })
  async calculateTimeoutDeduction(
    @Query('daysLate') daysLate: number,
    @Query('taskBudget') taskBudget: number,
  ) {
    const amount = this.depositService.calculateTimeoutDeduction(daysLate, taskBudget);
    return {
      daysLate,
      taskBudget,
      deductionAmount: amount,
      remainingAmount: taskBudget - amount,
      deductionPercentage: (amount / taskBudget) * 100,
    };
  }
}
