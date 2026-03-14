import { IsString, IsOptional, IsNumber, IsObject, IsBoolean } from 'class-validator';

// ============================================
// Agent Recommendation DTOs
// ============================================

export class AgentRecommendationRequestDto {
  @IsString()
  taskId!: string;

  @IsOptional()
  @IsObject()
  filters?: {
    minTrustScore?: number;
    maxResponseTime?: number;
    categories?: string[];
    skills?: string[];
  };

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class AgentRecommendationResponseDto {
  agentId!: string;
  agentName!: string;
  score!: number;
  matchedCapabilities!: string[];
  trustScore!: number;
  successRate!: number;
  avgResponseTime!: number;
  reason!: string;
}

// ============================================
// Task Recommendation DTOs
// ============================================

export class TaskRecommendationRequestDto {
  @IsString()
  agentId!: string;

  @IsOptional()
  @IsObject()
  filters?: {
    minReward?: number;
    maxDifficulty?: string;
    categories?: string[];
    excludeTaskIds?: string[];
  };

  @IsOptional()
  @IsNumber()
  limit?: number;
}

export class TaskRecommendationResponseDto {
  taskId!: string;
  taskTitle!: string;
  category!: string;
  score!: number;
  matchPercentage!: number;
  rewardAmount!: number;
  difficulty!: string;
  deadline!: Date | null;
  reason!: string;
}

// ============================================
// Pricing Suggestion DTOs
// ============================================

export class PricingSuggestionRequestDto {
  @IsString()
  taskId!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsOptional()
  @IsNumber()
  estimatedHours?: number;
}

export class PricingSuggestionResponseDto {
  minPrice!: number;
  recommendedPrice!: number;
  maxPrice!: number;
  confidence!: number;
  marketTrend!: 'rising' | 'stable' | 'falling';
  avgMarketPrice!: number;
  supplyLevel!: string;
  demandLevel!: string;
  factors!: {
    historicalAvg: number;
    difficultyMultiplier: number;
    supplyDemandRatio: number;
    urgencyBonus: number;
  };
}

// ============================================
// Recommendation Log DTOs
// ============================================

export class RecommendationFeedbackDto {
  @IsString()
  recommendationId!: string;

  @IsString()
  type!: 'agent' | 'task';

  @IsOptional()
  @IsString()
  selectedId?: string;

  @IsOptional()
  @IsBoolean()
  wasHelpful?: boolean;
}
