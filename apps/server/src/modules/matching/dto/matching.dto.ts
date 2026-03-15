import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUUID,
  IsArray,
  IsNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// Matching DTOs
// ============================================

export class RecommendAgentsDto {
  @ApiPropertyOptional({ description: '返回结果数量限制', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ description: '最低匹配分数', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  minScore?: number = 0;

  @ApiPropertyOptional({ description: '过滤条件' })
  @IsOptional()
  filters?: MatchingFiltersDto;
}

export class RecommendTasksDto {
  @ApiPropertyOptional({ description: '返回结果数量限制', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ description: '最低匹配分数', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  minScore?: number = 0;

  @ApiPropertyOptional({ description: '过滤条件' })
  @IsOptional()
  filters?: TaskMatchingFiltersDto;
}

export class MatchingFiltersDto {
  @ApiPropertyOptional({ description: '最低评分要求' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minRating?: number;

  @ApiPropertyOptional({ description: '最高时薪' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxHourlyRate?: number;

  @ApiPropertyOptional({ description: '时区偏好' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: '只包含可用Agent' })
  @IsOptional()
  availableOnly?: boolean;
}

export class TaskMatchingFiltersDto {
  @ApiPropertyOptional({ description: '最低预算' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minBudget?: number;

  @ApiPropertyOptional({ description: '最高预算' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxBudget?: number;

  @ApiPropertyOptional({ description: '任务类别' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class CalculateMatchDto {
  @ApiProperty({ description: 'Agent ID' })
  @IsUUID()
  agentId: string;

  @ApiProperty({ description: 'Task ID' })
  @IsUUID()
  taskId: string;
}

// ============================================
// Response DTOs
// ============================================

export class AgentMatchDto {
  @ApiProperty({ description: 'Agent信息' })
  agent: any;

  @ApiProperty({ description: '匹配分数 0-1' })
  score: number;

  @ApiProperty({ description: '匹配原因', type: [String] })
  reasons: string[];

  @ApiProperty({ description: '详细分数' })
  breakdown: MatchBreakdownDto;
}

export class TaskMatchDto {
  @ApiProperty({ description: 'Task信息' })
  task: any;

  @ApiProperty({ description: '匹配分数 0-1' })
  score: number;

  @ApiProperty({ description: '匹配原因', type: [String] })
  reasons: string[];

  @ApiProperty({ description: '详细分数' })
  breakdown: MatchBreakdownDto;
}

export class MatchBreakdownDto {
  @ApiProperty({ description: '技能匹配分数' })
  skillScore: number;

  @ApiProperty({ description: '历史表现分数' })
  performanceScore: number;

  @ApiProperty({ description: '价格匹配分数' })
  priceScore: number;

  @ApiProperty({ description: '可用性分数' })
  availabilityScore: number;

  @ApiProperty({ description: '地理位置分数' })
  locationScore: number;

  @ApiProperty({ description: '各维度权重' })
  weights: MatchWeightsDto;
}

export class MatchWeightsDto {
  @ApiProperty()
  skill: number;

  @ApiProperty()
  performance: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  availability: number;

  @ApiProperty()
  location: number;
}

export class MatchCalculationResponseDto {
  @ApiProperty({ description: 'Agent ID' })
  agentId: string;

  @ApiProperty({ description: 'Task ID' })
  taskId: string;

  @ApiProperty({ description: '总匹配分数' })
  overallScore: number;

  @ApiProperty({ description: '详细分数' })
  breakdown: MatchBreakdownDto;

  @ApiProperty({ description: '匹配原因', type: [String] })
  reasons: string[];

  @ApiProperty({ description: '推荐级别' })
  recommendation: 'highly_recommended' | 'recommended' | 'neutral' | 'not_recommended';
}

// ============================================
// Statistics
// ============================================

export class MatchingStatisticsDto {
  @ApiProperty()
  totalRecommendations: number;

  @ApiProperty()
  avgMatchScore: number;

  @ApiProperty()
  successRate: number;

  @ApiProperty()
  topMatchedSkills: { skillId: string; skillName: string; matchCount: number }[];

  @ApiProperty()
  matchScoreDistribution: { range: string; count: number }[];
}
