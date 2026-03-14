import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateFileDto {
  @IsOptional()
  @IsString()
  taskId?: string;

  @IsString()
  @IsNotEmpty()
  agentId!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class FileQueryDto {
  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  agentId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
