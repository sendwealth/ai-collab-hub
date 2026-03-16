import { IsOptional, IsArray, IsInt, IsEnum, Min, Max } from 'class-validator';

export class StartTestDto {
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  questionCount?: number;

  @IsOptional()
  @IsEnum(['code_review', 'bug_fix', 'all'])
  type?: string;

  @IsOptional()
  @IsEnum(['frontend', 'backend', 'security', 'performance', 'all'])
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;
}
