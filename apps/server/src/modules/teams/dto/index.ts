import { IsString, IsOptional, MinLength, IsIn } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MinLength(1)
  name: string = '';

  @IsOptional()
  @IsString()
  description?: string;
}

export class AddMemberDto {
  @IsString()
  agentId: string = '';

  @IsOptional()
  @IsIn(['owner', 'admin', 'member'])
  role?: 'owner' | 'admin' | 'member';
}

export class UpdateMemberRoleDto {
  @IsIn(['owner', 'admin', 'member'])
  role: 'owner' | 'admin' | 'member' = 'member';
}
