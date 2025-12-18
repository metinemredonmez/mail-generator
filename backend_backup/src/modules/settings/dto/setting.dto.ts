import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
}

export class CreateSettingDto {
  @ApiProperty({ example: 'mail_domain' })
  @IsString()
  key: string;

  @ApiProperty({ example: 'uzmanumre.com' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ enum: SettingType, default: SettingType.STRING })
  @IsEnum(SettingType)
  @IsOptional()
  type?: SettingType = SettingType.STRING;
}

export class UpdateSettingDto {
  @ApiProperty({ example: 'uzmanumre.com' })
  @IsString()
  value: string;
}

export class BulkUpdateSettingsDto {
  @ApiProperty({
    example: {
      mail_domain: 'uzmanumre.com',
      smtp_host: 'mail.uzmanumre.com',
      smtp_port: '587',
    },
  })
  @IsObject()
  settings: Record<string, string>;
}

// Default settings structure
export const DEFAULT_SETTINGS = {
  // Mail Server Settings
  mail_domain: { value: 'uzmanumre.com', type: SettingType.STRING },
  mail_provider: { value: 'cyberpanel', type: SettingType.STRING }, // cyberpanel, zoho, custom

  // SMTP Settings
  smtp_host: { value: '', type: SettingType.STRING },
  smtp_port: { value: '587', type: SettingType.NUMBER },
  smtp_secure: { value: 'true', type: SettingType.BOOLEAN },

  // IMAP Settings
  imap_host: { value: '', type: SettingType.STRING },
  imap_port: { value: '993', type: SettingType.NUMBER },
  imap_secure: { value: 'true', type: SettingType.BOOLEAN },

  // CyberPanel Settings
  cyberpanel_url: { value: '', type: SettingType.STRING },
  cyberpanel_admin_user: { value: '', type: SettingType.STRING },
  cyberpanel_admin_pass: { value: '', type: SettingType.STRING },

  // Verification Code Settings
  code_check_interval: { value: '60', type: SettingType.NUMBER }, // seconds
  code_patterns: {
    value: JSON.stringify({
      nusuk: ['\\b\\d{6}\\b', 'verification code[:\\s]*(\\d{6})'],
      ravza: ['reservation[:\\s]*([A-Z0-9]{8})', '\\b[A-Z]{2}\\d{6}\\b'],
    }),
    type: SettingType.JSON,
  },

  // General Settings
  auto_check_inbox: { value: 'true', type: SettingType.BOOLEAN },
  notifications_enabled: { value: 'true', type: SettingType.BOOLEAN },
};
