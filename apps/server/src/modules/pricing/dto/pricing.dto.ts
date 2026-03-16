import { ApiProperty } from '@nestjs/swagger';

export enum TaskCategory {
  CODE_REVIEW = 'code_review',
  BUG_FIX = 'bug_fix',
  DOCUMENTATION = 'documentation',
  DATA_PROCESSING = 'data_processing',
  TESTING = 'testing',
  CONSULTATION = 'consultation',
}

export enum AgentLevel {
  NEWBIE = 'newbie',      // 新手
  STANDARD = 'standard',  // 标准
  EXPERT = 'expert',      // 专家
}

export class PricingItem {
  @ApiProperty()
  category: TaskCategory;

  @ApiProperty()
  taskType: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  newbiePrice: { min: number; max: number };

  @ApiProperty()
  standardPrice: { min: number; max: number };

  @ApiProperty()
  expertPrice: { min: number; max: number };

  @ApiProperty()
  unit: string; // 'per_task' | 'per_hour' | 'per_line' | 'per_page'

  @ApiProperty()
  estimatedTime: string;

  @ApiProperty({ required: false })
  notes?: string;
}

export class PricingTableDto {
  @ApiProperty()
  items: PricingItem[];

  @ApiProperty()
  lastUpdated: Date;

  @ApiProperty()
  marketAveragePrice: number;
}

export class PriceSuggestionDto {
  @ApiProperty()
  taskType: string;

  @ApiProperty()
  agentLevel: AgentLevel;

  @ApiProperty()
  suggestedPrice: number;

  @ApiProperty()
  priceRange: { min: number; max: number };

  @ApiProperty()
  confidence: number; // 0-1, AI建议的置信度

  @ApiProperty()
  reasons: string[];
}
