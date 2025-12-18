import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum ActivityAction {
  // Passenger actions
  PASSENGER_CREATE = 'PASSENGER_CREATE',
  PASSENGER_UPDATE = 'PASSENGER_UPDATE',
  PASSENGER_DELETE = 'PASSENGER_DELETE',
  PASSENGER_IMPORT = 'PASSENGER_IMPORT',

  // Email actions
  EMAIL_CREATE = 'EMAIL_CREATE',
  EMAIL_DELETE = 'EMAIL_DELETE',
  EMAIL_BULK_CREATE = 'EMAIL_BULK_CREATE',

  // Inbox actions
  INBOX_CHECK = 'INBOX_CHECK',
  CODE_FOUND = 'CODE_FOUND',
  CODE_USED = 'CODE_USED',

  // Group actions
  GROUP_CREATE = 'GROUP_CREATE',
  GROUP_UPDATE = 'GROUP_UPDATE',
  GROUP_DELETE = 'GROUP_DELETE',

  // Auth actions
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',

  // Settings actions
  SETTINGS_UPDATE = 'SETTINGS_UPDATE',
}

export enum ActivityEntity {
  PASSENGER = 'Passenger',
  EMAIL = 'Email',
  GROUP = 'Group',
  INBOX = 'InboxItem',
  ADMIN = 'Admin',
  SETTINGS = 'Settings',
}

export class ActivityQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ActivityAction })
  @IsEnum(ActivityAction)
  @IsOptional()
  action?: ActivityAction;

  @ApiPropertyOptional({ enum: ActivityEntity })
  @IsEnum(ActivityEntity)
  @IsOptional()
  entity?: ActivityEntity;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  adminId?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 50;
}

export class CreateActivityDto {
  action: ActivityAction;
  entity: ActivityEntity;
  entityId?: string;
  details?: Record<string, any>;
  adminId?: string;
  ipAddress?: string;
  userAgent?: string;
}
