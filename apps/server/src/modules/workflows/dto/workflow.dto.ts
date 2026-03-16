import { IsString, IsOptional, IsObject, IsBoolean, IsArray, IsEnum, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ============================================
// Workflow Definition DTOs
// ============================================

export class WorkflowNodeDto {
  @ApiProperty({ description: 'Node ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: 'Node type', enum: ['start', 'end', 'task', 'condition', 'parallel', 'delay', 'loop'] })
  @IsEnum(['start', 'end', 'task', 'condition', 'parallel', 'delay', 'loop'])
  type!: string;

  @ApiPropertyOptional({ description: 'Agent ID for task nodes' })
  @IsOptional()
  @IsString()
  agentId?: string;

  @ApiPropertyOptional({ description: 'Condition expression for condition nodes' })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({ description: 'Delay in milliseconds for delay nodes' })
  @IsOptional()
  @IsNumber()
  delay?: number;

  @ApiPropertyOptional({ description: 'Node configuration' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class WorkflowEdgeDto {
  @ApiProperty({ description: 'Source node ID' })
  @IsString()
  from!: string;

  @ApiProperty({ description: 'Target node ID' })
  @IsString()
  to!: string;

  @ApiPropertyOptional({ description: 'Condition for conditional edges' })
  @IsOptional()
  condition?: boolean | string;
}

export class WorkflowDefinitionDto {
  @ApiProperty({ type: [WorkflowNodeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowNodeDto)
  nodes!: WorkflowNodeDto[];

  @ApiProperty({ type: [WorkflowEdgeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowEdgeDto)
  edges!: WorkflowEdgeDto[];
}

// ============================================
// Create Workflow Template
// ============================================

export class CreateWorkflowTemplateDto {
  @ApiProperty({ description: 'Template name' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Template category' })
  @IsString()
  category!: string;

  @ApiPropertyOptional({ description: 'Template version' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ description: 'Workflow definition', type: WorkflowDefinitionDto })
  @ValidateNested()
  @Type(() => WorkflowDefinitionDto)
  definition!: WorkflowDefinitionDto;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Author' })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================
// Update Workflow Template
// ============================================

export class UpdateWorkflowTemplateDto {
  @ApiPropertyOptional({ description: 'Template name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Template description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Template category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Workflow definition', type: WorkflowDefinitionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkflowDefinitionDto)
  definition?: WorkflowDefinitionDto;

  @ApiPropertyOptional({ description: 'Tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ============================================
// Start Workflow Instance
// ============================================

export class StartWorkflowDto {
  @ApiProperty({ description: 'Template ID' })
  @IsString()
  templateId!: string;

  @ApiPropertyOptional({ description: 'Associated task ID' })
  @IsOptional()
  @IsString()
  taskId?: string;

  @ApiPropertyOptional({ description: 'Initial context variables' })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

// ============================================
// Control Workflow Instance
// ============================================

export class ControlWorkflowDto {
  @ApiProperty({ description: 'Instance ID' })
  @IsString()
  instanceId!: string;

  @ApiPropertyOptional({ description: 'New context variables' })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

// ============================================
// Run Workflow Directly (without template)
// ============================================

export class RunWorkflowDto {
  @ApiProperty({ description: 'Workflow definition', type: WorkflowDefinitionDto })
  @ValidateNested()
  @Type(() => WorkflowDefinitionDto)
  definition!: WorkflowDefinitionDto;

  @ApiPropertyOptional({ description: 'Initial context variables' })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

// ============================================
// Workflow Execution Result
// ============================================

export class NodeExecutionResult {
  @ApiProperty({ description: 'Node ID' })
  nodeId!: string;

  @ApiProperty({ description: 'Node type' })
  nodeType!: string;

  @ApiProperty({ description: 'Execution status' })
  status!: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

  @ApiPropertyOptional({ description: 'Node output data' })
  output?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;

  @ApiPropertyOptional({ description: 'Execution start time' })
  startedAt?: Date;

  @ApiPropertyOptional({ description: 'Execution end time' })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Execution duration in ms' })
  duration?: number;
}

export class WorkflowExecutionResult {
  @ApiProperty({ description: 'Execution status' })
  status!: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

  @ApiPropertyOptional({ description: 'Execution start time' })
  startTime?: Date;

  @ApiPropertyOptional({ description: 'Execution end time' })
  endTime?: Date;

  @ApiPropertyOptional({ description: 'Total execution duration in ms' })
  totalDuration?: number;

  @ApiProperty({ description: 'Node execution results', type: [NodeExecutionResult] })
  steps!: NodeExecutionResult[];

  @ApiPropertyOptional({ description: 'Final context variables' })
  context?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;
}
