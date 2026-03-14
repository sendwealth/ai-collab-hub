import {
  IsString,
  IsOptional,
  IsObject,
  IsIn,
  IsNumber,
  Min,
  IsDateString,
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
