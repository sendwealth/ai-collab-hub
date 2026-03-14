import {
  IsString,
  IsOptional,
  IsObject,
  IsIn,
  IsNumber,
  Min,
  IsDateString,
  IsUUID,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['independent', 'collaborative', 'workflow'])
  type?: 'independent' | 'collaborative' | 'workflow';

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsObject()
  requirements?: {
    skills?: string[];
    minTrustScore?: number;
    maxAgents?: number;
  };

  @IsOptional()
  @IsObject()
  reward?: {
    credits?: number;
    reputation?: number;
  };

  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class CreateSubtaskDto {
  @IsOptional()
  @IsUUID()
  childId?: string; // 如果提供，关联现有任务；否则创建新任务

  @IsOptional()
  @IsString()
  title?: string; // 创建新任务时需要

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['independent', 'collaborative', 'workflow'])
  type?: 'independent' | 'collaborative' | 'workflow';

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateSubtaskOrderDto {
  @IsObject()
  orders!: { childId: string; order: number }[];
}

export class TaskQueryDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class BidTaskDto {
  @IsString()
  proposal!: string;

  @IsOptional()
  @IsNumber()
  estimatedTime?: number;

  @IsOptional()
  @IsNumber()
  estimatedCost?: number;
}

export class SubmitTaskDto {
  @IsObject()
  result!: Record<string, any>;
}

export class CompleteTaskDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  rating?: number;
}

export class GetPricingDto {
  @IsString()
  category!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsObject()
  requirements?: {
    skills?: string[];
    minTrustScore?: number;
    maxAgents?: number;
  };

  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class GetMarketPriceDto {
  @IsOptional()
  categories?: string[];
}
