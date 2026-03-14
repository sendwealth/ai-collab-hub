import { IsString, IsOptional, IsObject, IsIn, MinLength } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  publicKey: string;

  @IsOptional()
  @IsObject()
  capabilities?: {
    skills?: string[];
    tools?: string[];
    protocols?: string[];
    maxConcurrentTasks?: number;
    estimatedResponseTime?: number;
  };

  @IsOptional()
  @IsObject()
  endpoint?: {
    http?: string;
    websocket?: string;
  };

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  capabilities?: Record<string, any>;

  @IsOptional()
  @IsObject()
  endpoint?: Record<string, any>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateAgentStatusDto {
  @IsIn(['idle', 'busy', 'offline'])
  status: 'idle' | 'busy' | 'offline';
}
