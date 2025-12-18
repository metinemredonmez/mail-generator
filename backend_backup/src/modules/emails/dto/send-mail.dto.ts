import { IsString, IsArray, IsOptional, IsUUID, IsEmail, MinLength, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMailDto {
  @ApiProperty({ description: 'Gonderici hesap ID' })
  @IsUUID()
  senderAccountId: string;

  @ApiProperty({ description: 'Alici e-posta adresleri', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  recipients: string[];

  @ApiProperty({ description: 'E-posta konusu' })
  @IsString()
  @MinLength(1)
  subject: string;

  @ApiPropertyOptional({ description: 'Duz metin icerik' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'HTML icerik' })
  @IsOptional()
  @IsString()
  html?: string;
}

export class SendToGroupDto {
  @ApiProperty({ description: 'Gonderici hesap ID' })
  @IsUUID()
  senderAccountId: string;

  @ApiProperty({ description: 'Grup ID' })
  @IsUUID()
  groupId: string;

  @ApiProperty({ description: 'E-posta konusu' })
  @IsString()
  @MinLength(1)
  subject: string;

  @ApiPropertyOptional({ description: 'Duz metin icerik' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'HTML icerik' })
  @IsOptional()
  @IsString()
  html?: string;
}

export class SendToPassengersDto {
  @ApiProperty({ description: 'Gonderici hesap ID' })
  @IsUUID()
  senderAccountId: string;

  @ApiProperty({ description: 'Yolcu ID listesi', type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  passengerIds: string[];

  @ApiProperty({ description: 'E-posta konusu' })
  @IsString()
  @MinLength(1)
  subject: string;

  @ApiPropertyOptional({ description: 'Duz metin icerik' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({ description: 'HTML icerik' })
  @IsOptional()
  @IsString()
  html?: string;
}

export class TestSmtpDto {
  @ApiProperty({ description: 'Test edilecek gonderici hesap ID' })
  @IsUUID()
  senderAccountId: string;
}
