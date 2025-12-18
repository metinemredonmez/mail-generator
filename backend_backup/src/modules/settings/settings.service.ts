import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateSettingDto, UpdateSettingDto, DEFAULT_SETTINGS, SettingType } from './dto/setting.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all settings as key-value object
   */
  async getAll(): Promise<Record<string, any>> {
    const settings = await this.prisma.setting.findMany();
    const result: Record<string, any> = {};

    for (const setting of settings) {
      result[setting.key] = this.parseValue(setting.value, setting.type);
    }

    return result;
  }

  /**
   * Get all settings as raw array
   */
  async getAllRaw() {
    return this.prisma.setting.findMany({
      orderBy: { key: 'asc' },
    });
  }

  /**
   * Get single setting by key
   */
  async get(key: string): Promise<any> {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      // Return default if exists
      const defaultSetting = DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS];
      if (defaultSetting) {
        return this.parseValue(defaultSetting.value, defaultSetting.type);
      }
      return null;
    }

    return this.parseValue(setting.value, setting.type);
  }

  /**
   * Create or update setting
   */
  async set(key: string, value: string, type: string = 'string') {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value, type },
      create: { key, value, type },
    });
  }

  /**
   * Bulk update settings
   */
  async bulkUpdate(settings: Record<string, string>) {
    const operations = Object.entries(settings).map(([key, value]) => {
      const defaultSetting = DEFAULT_SETTINGS[key as keyof typeof DEFAULT_SETTINGS];
      const type = defaultSetting?.type || SettingType.STRING;

      return this.prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value), type },
      });
    });

    return this.prisma.$transaction(operations);
  }

  /**
   * Delete setting
   */
  async delete(key: string) {
    const setting = await this.prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      throw new NotFoundException(`Ayar bulunamadi: ${key}`);
    }

    return this.prisma.setting.delete({
      where: { key },
    });
  }

  /**
   * Initialize default settings (run on app start or seed)
   */
  async initializeDefaults() {
    const existingSettings = await this.prisma.setting.findMany();
    const existingKeys = new Set(existingSettings.map((s) => s.key));

    const toCreate: { key: string; value: string; type: string }[] = [];

    for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
      if (!existingKeys.has(key)) {
        toCreate.push({
          key,
          value: config.value,
          type: config.type,
        });
      }
    }

    if (toCreate.length > 0) {
      await this.prisma.setting.createMany({
        data: toCreate,
        skipDuplicates: true,
      });
    }

    return { created: toCreate.length };
  }

  /**
   * Get mail configuration
   */
  async getMailConfig() {
    const all = await this.getAll();
    return {
      domain: all.mail_domain || 'uzmanumre.com',
      provider: all.mail_provider || 'cyberpanel',
      smtp: {
        host: all.smtp_host || '',
        port: parseInt(all.smtp_port) || 587,
        secure: all.smtp_secure === true || all.smtp_secure === 'true',
      },
      imap: {
        host: all.imap_host || '',
        port: parseInt(all.imap_port) || 993,
        secure: all.imap_secure === true || all.imap_secure === 'true',
      },
      cyberpanel: {
        url: all.cyberpanel_url || '',
        adminUser: all.cyberpanel_admin_user || '',
        adminPass: all.cyberpanel_admin_pass || '',
      },
    };
  }

  private parseValue(value: string, type: string): any {
    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'boolean':
        return value === 'true';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }
}
