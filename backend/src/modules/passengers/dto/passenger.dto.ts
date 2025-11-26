import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsInt,
  Min,
  IsArray,
  ValidateNested,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum NusukStatus {
  PENDING = 'PENDING',
  EMAIL_CREATED = 'EMAIL_CREATED',
  CODE_RECEIVED = 'CODE_RECEIVED',
  ACCOUNT_VERIFIED = 'ACCOUNT_VERIFIED',
  RESERVATION_MADE = 'RESERVATION_MADE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export class CreatePassengerDto {
  @ApiProperty({ example: 'Ahmet' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Yilmaz' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '+905551234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'U12345678' })
  @IsString()
  @IsOptional()
  passportNo?: string;

  @ApiPropertyOptional({ example: 'TR' })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  groupId?: string;
}

export class UpdatePassengerDto {
  @ApiPropertyOptional({ example: 'Ahmet' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Yilmaz' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: '+905551234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'U12345678' })
  @IsString()
  @IsOptional()
  passportNo?: string;

  @ApiPropertyOptional({ example: 'TR' })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiPropertyOptional({ example: '1990-01-15' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({ enum: NusukStatus })
  @IsEnum(NusukStatus)
  @IsOptional()
  nusukStatus?: NusukStatus;
}

export class PassengerQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  hasEmail?: boolean;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  groupId?: string;

  @ApiPropertyOptional({ enum: NusukStatus })
  @IsEnum(NusukStatus)
  @IsOptional()
  nusukStatus?: NusukStatus;
}

export class BulkCreatePassengersDto {
  @ApiProperty({ type: [CreatePassengerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePassengerDto)
  passengers: CreatePassengerDto[];
}
