import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class InboxQueryDto {
  @ApiPropertyOptional({ description: 'Sadece kodlu mesajlar', type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasCode?: boolean;

  @ApiPropertyOptional({ description: 'Sadece okunmamış', type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({ description: 'Sayfa numarası', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Sayfa başına kayıt', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class MarkReadDto {
  @ApiProperty({ description: 'Okundu olarak işaretlenecek mesaj IDleri' })
  @IsArray()
  @IsUUID('4', { each: true })
  itemIds: string[];
}

export class MockInboxItemDto {
  @ApiProperty({ example: 'Nusuk Verification Code' })
  @IsString()
  subject: string;

  @ApiProperty({ example: 'noreply@nusuk.sa' })
  @IsString()
  from: string;

  @ApiProperty({ example: 'Your verification code is: 123456' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  code?: string;
}
