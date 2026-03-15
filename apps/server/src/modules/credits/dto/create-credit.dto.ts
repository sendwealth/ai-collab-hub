import { IsInt, Min, IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';

export enum TransactionType {
  EARN = 'earn',
  SPEND = 'spend',
  WITHDRAW = 'withdraw',
  DEPOSIT = 'deposit',
  TRANSFER = 'transfer',
  FREEZE = 'freeze',
  UNFREEZE = 'unfreeze',
}

export class CreateCreditDto {
  @Min(0)
  balance: number = 0;
}

export class DepositDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class WithdrawDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class TransferDto {
  @IsString()
  toAgentId!: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class FreezeDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class GetTransactionHistoryDto {
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
