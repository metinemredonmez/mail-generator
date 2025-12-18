import {
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateGroupDto {
  @ApiProperty({ example: 'Ocak 2025 Umre Turu' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Istanbul kalkisli umre turu' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-01-25' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UpdateGroupDto {
  @ApiPropertyOptional({ example: 'Ocak 2025 Umre Turu' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Istanbul kalkisli umre turu' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2025-01-15' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-01-25' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class GroupQueryDto {
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
}

export class AddPassengersDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  passengerIds: string[];
}
