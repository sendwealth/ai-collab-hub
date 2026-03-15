import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================
// SkillTag DTOs
// ============================================

export class CreateSkillDto {
  @ApiProperty({ description: '技能名称', example: 'TypeScript' })
  @IsString()
  name: string;

  @ApiProperty({
    description: '技能类别',
    example: 'frontend',
    enum: ['frontend', 'backend', 'ai', 'data', 'devops', 'design', 'other'],
  })
  @IsEnum(['frontend', 'backend', 'ai', 'data', 'devops', 'design', 'other'])
  category: string;

  @ApiProperty({ description: '难度等级 1-5', example: 3, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  level: number;

  @ApiPropertyOptional({ description: '技能描述' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSkillDto {
  @ApiPropertyOptional({ description: '技能名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: '技能类别',
    enum: ['frontend', 'backend', 'ai', 'data', 'devops', 'design', 'other'],
  })
  @IsOptional()
  @IsEnum(['frontend', 'backend', 'ai', 'data', 'devops', 'design', 'other'])
  category?: string;

  @ApiPropertyOptional({ description: '难度等级 1-5' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  level?: number;

  @ApiPropertyOptional({ description: '技能描述' })
  @IsOptional()
  @IsString()
  description?: string;
}

export class SkillQueryDto {
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

  @ApiPropertyOptional({ description: '技能类别' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '难度等级' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  level?: number;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class SkillResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  level: number;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ============================================
// AgentSkill DTOs
// ============================================

export class AddAgentSkillDto {
  @ApiProperty({ description: '技能ID' })
  @IsUUID()
  skillId: string;

  @ApiProperty({ description: '掌握程度 1-5' })
  @IsInt()
  @Min(1)
  @Max(5)
  level: number;
}

export class UpdateAgentSkillDto {
  @ApiPropertyOptional({ description: '掌握程度 1-5' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  level?: number;
}

export class AgentSkillResponseDto {
  @ApiProperty()
  agentId: string;

  @ApiProperty()
  skillId: string;

  @ApiProperty()
  skill?: SkillResponseDto;

  @ApiProperty()
  level: number;

  @ApiProperty()
  verified: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ============================================
// TaskSkill DTOs
// ============================================

export class AddTaskSkillDto {
  @ApiProperty({ description: '技能ID' })
  @IsUUID()
  skillId: string;

  @ApiPropertyOptional({ description: '是否必需', default: true })
  @IsOptional()
  @IsBoolean()
  required?: boolean = true;

  @ApiPropertyOptional({ description: '最低等级要求 1-5', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  minLevel?: number = 1;
}

export class UpdateTaskSkillDto {
  @ApiPropertyOptional({ description: '是否必需' })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: '最低等级要求 1-5' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  minLevel?: number;
}

export class TaskSkillResponseDto {
  @ApiProperty()
  taskId: string;

  @ApiProperty()
  skillId: string;

  @ApiProperty()
  skill?: SkillResponseDto;

  @ApiProperty()
  required: boolean;

  @ApiProperty()
  minLevel: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

// ============================================
// Paginated Response
// ============================================

export class PaginatedSkillsResponseDto {
  @ApiProperty({ type: [SkillResponseDto] })
  data: SkillResponseDto[];

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

export class SkillStatisticsDto {
  @ApiProperty()
  totalSkills: number;

  @ApiProperty()
  categories: { category: string; count: number }[];

  @ApiProperty()
  levelDistribution: { level: number; count: number }[];

  @ApiProperty()
  topAgentSkills: { skillId: string; skillName: string; agentCount: number }[];

  @ApiProperty()
  topTaskSkills: { skillId: string; skillName: string; taskCount: number }[];
}

// ============================================
// Recommendation
// ============================================

export class SkillRecommendationDto {
  @ApiProperty()
  skill: SkillResponseDto;

  @ApiProperty({ description: '推荐置信度 0-1' })
  confidence: number;

  @ApiProperty({ description: '推荐原因' })
  reason: string;
}
