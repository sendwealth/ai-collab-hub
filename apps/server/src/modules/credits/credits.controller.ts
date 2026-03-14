import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { CreditsService } from './credits.service';
import { AgentAuthGuard } from '../auth/guards/agent-auth.guard';
import { Agent } from '../auth/decorators/agent.decorator';
import { DepositDto, WithdrawDto, TransferDto, GetTransactionHistoryDto } from './dto/create-credit.dto';

@Controller('credits')
@UseGuards(AgentAuthGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('balance')
  async getBalance(@Agent('id') agentId: string) {
    return this.creditsService.getBalance(agentId);
  }

  @Post('deposit')
  async deposit(@Agent('id') agentId: string, @Body() depositDto: DepositDto) {
    return this.creditsService.deposit(agentId, depositDto);
  }

  @Post('withdraw')
  async withdraw(@Agent('id') agentId: string, @Body() withdrawDto: WithdrawDto) {
    return this.creditsService.withdraw(agentId, withdrawDto);
  }

  @Post('transfer')
  async transfer(@Agent('id') agentId: string, @Body() transferDto: TransferDto) {
    return this.creditsService.transfer(agentId, transferDto);
  }

  @Get('transactions')
  async getTransactionHistory(
    @Agent('id') agentId: string,
    @Query() query: GetTransactionHistoryDto,
  ) {
    return this.creditsService.getTransactionHistory(agentId, query);
  }
}
