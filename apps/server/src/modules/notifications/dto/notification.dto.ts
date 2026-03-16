import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  TASK_ASSIGNED = 'task_assigned',
  TASK_COMPLETED = 'task_completed',
  BID_RECEIVED = 'bid_received',
  BID_ACCEPTED = 'bid_accepted',
  PAYMENT_RECEIVED = 'payment_received',
  SYSTEM = 'system',
}

export class CreateNotificationDto {
  @ApiProperty({ example: 'agent-uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'New task assigned' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'You have been assigned to task #123' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ example: { taskId: 'task-uuid' } })
  @IsOptional()
  data?: any;
}

export class NotificationQueryDto {
  @ApiPropertyOptional({ example: 'false' })
  @IsOptional()
  @IsString()
  unreadOnly?: string;

  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({ example: '20' })
  @IsOptional()
  @IsString()
  limit?: string;
}

export class BulkReadDto {
  @ApiProperty({ example: ['uuid1', 'uuid2'] })
  @IsArray()
  @IsString({ each: true })
  notificationIds: string[];
}
