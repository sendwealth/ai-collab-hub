import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// Rating DTOs
// ============================================

export class CreateRatingDto {
  @ApiProperty({ description: '评分来源用户ID' })
  @IsString()
  fromUserId: string;

  @ApiProperty({ description: '被评分的Agent ID' })
  @IsUUID()
  toAgentId: string;

  @ApiPropertyOptional({ description: '关联的任务ID' })
  @IsOptional()
  @IsUUID()
  taskId?: string;

  @ApiProperty({ description: '质量评分 1-5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  quality: number;

  @ApiProperty({ description: '速度评分 1-5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  speed: number;

  @ApiProperty({ description: '沟通评分 1-5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  communication: number;

  @ApiProperty({ description: '专业度评分 1-5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  professionalism: number;

  @ApiPropertyOptional({ description: '评价内容', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

export class RatingQueryDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: '最低评分筛选' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;
}

export class RatingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fromUserId: string;

  @ApiProperty()
  toAgentId: string;

  @ApiPropertyOptional()
  taskId?: string;

  @ApiProperty()
  quality: number;

  @ApiProperty()
  speed: number;

  @ApiProperty()
  communication: number;

  @ApiProperty()
  professionalism: number;

  @ApiProperty()
  overallRating: number;

  @ApiPropertyOptional()
  comment?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ============================================
// Rating Summary DTOs
// ============================================

export class AgentRatingSummaryDto {
  @ApiProperty()
  agentId: string;

  @ApiProperty()
  avgQuality: number;

  @ApiProperty()
  avgSpeed: number;

  @ApiProperty()
  avgCommunication: number;

  @ApiProperty()
  avgProfessionalism: number;

  @ApiProperty()
  overallRating: number;

  @ApiProperty()
  totalRatings: number;

  @ApiProperty()
  rating5Count: number;

  @ApiProperty()
  rating4Count: number;

  @ApiProperty()
  rating3Count: number;

  @ApiProperty()
  rating2Count: number;

  @ApiProperty()
  rating1Count: number;

  @ApiProperty()
  ratingDistribution: { rating: number; count: number; percentage: number }[];
}

// ============================================
// Paginated Response
// ============================================

export class PaginatedRatingsResponseDto {
  @ApiProperty({ type: [RatingResponseDto] })
  data: RatingResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// ============================================
// Statistics
// ============================================

export class RatingStatisticsDto {
  @ApiProperty()
  totalRatings: number;

  @ApiProperty()
  totalRatedAgents: number;

  @ApiProperty()
  avgQuality: number;

  @ApiProperty()
  avgSpeed: number;

  @ApiProperty()
  avgCommunication: number;

  @ApiProperty()
  avgProfessionalism: number;

  @ApiProperty()
  avgOverall: number;
}

// ============================================
// Anomaly Detection
// ============================================

export class AnomalyDetectionDto {
  @ApiProperty()
  agentId: string;

  @ApiProperty()
  anomalousUsers: string[];

  @ApiProperty()
  suspiciousPatterns: string[];

  @ApiProperty()
  recommendation: string;
}

// ============================================
// Rating History
// ============================================

export class RatingHistoryPointDto {
  @ApiProperty()
  date: string;

  @ApiProperty()
  avgRating: number;

  @ApiProperty()
  count: number;
}

export class RatingHistoryDto {
  @ApiProperty({ type: [RatingHistoryPointDto] })
  history: RatingHistoryPointDto[];

  @ApiProperty()
  trend: 'up' | 'down' | 'stable';

  @ApiProperty()
  changePercent: number;
}
