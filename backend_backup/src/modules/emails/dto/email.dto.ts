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

export class CreateEmailDto {
  @ApiPropertyOptional({
    description: 'Özel kullanıcı adı (opsiyonel)',
    example: 'ahmet.yilmaz',
  })
  @IsOptional()
  @IsString()
  customUsername?: string;
}

export class BulkCreateEmailDto {
  @ApiProperty({
    description: 'E-posta oluşturulacak yolcu IDleri',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  passengerIds: string[];
}

export class EmailQueryDto {
  @ApiPropertyOptional({ description: 'Arama terimi' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Aktif/Pasif', type: Boolean })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

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
