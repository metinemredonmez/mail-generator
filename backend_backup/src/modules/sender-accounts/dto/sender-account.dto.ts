import { IsString, IsEmail, IsOptional, IsBoolean, IsInt, Min, Max, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSenderAccountDto {
  @ApiProperty({ description: 'Hesap adi', example: 'Uzman Umre' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ description: 'E-posta adresi', example: 'info@uzmanumre.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'SMTP sifresi' })
  @IsString()
  @MinLength(1)
  password: string;

  @ApiPropertyOptional({ description: 'SMTP sunucu adresi', example: 'smtp.gmail.com' })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional({ description: 'SMTP port', example: 587 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  smtpPort?: number;

  @ApiPropertyOptional({ description: 'Varsayilan gonderici mi?', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateSenderAccountDto {
  @ApiPropertyOptional({ description: 'Hesap adi' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'E-posta adresi' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'SMTP sifresi' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'SMTP sunucu adresi' })
  @IsOptional()
  @IsString()
  smtpHost?: string;

  @ApiPropertyOptional({ description: 'SMTP port' })
  @IsOptional()
  @IsInt()
  smtpPort?: number;

  @ApiPropertyOptional({ description: 'Aktif mi?' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Varsayilan gonderici mi?' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
