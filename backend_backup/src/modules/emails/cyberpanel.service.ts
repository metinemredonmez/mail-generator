import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';

interface CyberPanelResponse {
  status: number;
  statusMessage?: string;
  error_message?: string;
  errorMessage?: string;
  data?: any;
}

interface CreateEmailResult {
  success: boolean;
  email?: string;
  password?: string;
  error?: string;
}

@Injectable()
export class CyberPanelService {
  private readonly logger = new Logger(CyberPanelService.name);
  private readonly client: AxiosInstance;
  private readonly adminUser: string;
  private readonly adminPass: string;
  private readonly domain: string;
  private readonly smtpHost: string;
  private readonly imapHost: string;

  constructor(private configService: ConfigService) {
    const baseURL = configService.get<string>('CYBERPANEL_URL') || '';
    this.adminUser = configService.get<string>('CYBERPANEL_ADMIN_USER') || '';
    this.adminPass = configService.get<string>('CYBERPANEL_ADMIN_PASS') || '';
    this.domain = configService.get<string>('MAIL_DOMAIN') || 'mail-service.uzmanumre.com';
    this.smtpHost = configService.get<string>('SMTP_HOST') || 'srv.uzmanumre.com';
    this.imapHost = configService.get<string>('IMAP_HOST') || 'srv.uzmanumre.com';

    // SSL verification - production'da aktif, self-signed için ALLOW_SELF_SIGNED_SSL=true kullan
    const isProduction = process.env.NODE_ENV === 'production';
    const allowSelfSigned = configService.get<string>('ALLOW_SELF_SIGNED_SSL') === 'true';
    const rejectUnauthorized = isProduction && !allowSelfSigned;

    const httpsAgent = new https.Agent({
      rejectUnauthorized,
    });

    this.client = axios.create({
      baseURL,
      httpsAgent,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.logger.log(`CyberPanel service initialized: ${baseURL}, Domain: ${this.domain}`);
  }

  /**
   * Check if CyberPanel is configured
   */
  isConfigured(): boolean {
    return !!(this.client.defaults.baseURL && this.adminUser && this.adminPass);
  }

  /**
   * Test CyberPanel connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        message: 'CyberPanel credentials not configured',
      };
    }

    try {
      // Try to list emails as a connection test
      const response = await this.client.post<CyberPanelResponse>(
        '/api/getEmailsForDomain',
        {
          adminUser: this.adminUser,
          adminPass: this.adminPass,
          domain: this.domain,
        },
      );

      const data = response.data;

      if (data.status === 1) {
        const emailCount = Array.isArray(data.data) ? data.data.length : 0;
        return {
          success: true,
          message: `Connected! Domain: ${this.domain}, ${emailCount} email(s) found`,
        };
      } else {
        return {
          success: false,
          message: data.error_message || data.errorMessage || 'Connection failed',
        };
      }
    } catch (error) {
      this.logger.error(`Test connection error: ${error.message}`);
      return {
        success: false,
        message: `Connection error: ${error.message}`,
      };
    }
  }

  /**
   * Create email account on CyberPanel
   */
  async createEmail(username: string, password: string): Promise<CreateEmailResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'CyberPanel is not configured',
      };
    }

    const email = `${username}@${this.domain}`;

    try {
      this.logger.log(`Creating email: ${email}`);

      const response = await this.client.post<CyberPanelResponse>(
        '/api/createEmailAccount',
        {
          adminUser: this.adminUser,
          adminPass: this.adminPass,
          domain: this.domain,
          userName: username,
          password: password,
        },
      );

      const data = response.data;

      if (data.status === 1) {
        this.logger.log(`Email created successfully: ${email}`);
        return {
          success: true,
          email,
          password,
        };
      } else {
        const errorMsg = data.error_message || data.errorMessage || 'Unknown error';
        this.logger.error(`Failed to create email: ${errorMsg}`);
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error) {
      this.logger.error(`Create email error: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete email account from CyberPanel
   */
  async deleteEmail(email: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      this.logger.log(`Deleting email: ${email}`);

      const response = await this.client.post<CyberPanelResponse>(
        '/api/deleteEmailAccount',
        {
          adminUser: this.adminUser,
          adminPass: this.adminPass,
          email: email,
        },
      );

      const data = response.data;

      if (data.status === 1) {
        this.logger.log(`Email deleted successfully: ${email}`);
        return true;
      } else {
        this.logger.error(`Failed to delete email: ${data.error_message || data.errorMessage}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`Delete email error: ${error.message}`);
      return false;
    }
  }

  /**
   * Change email password on CyberPanel
   */
  async changePassword(email: string, newPassword: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      this.logger.log(`Changing password for: ${email}`);

      const response = await this.client.post<CyberPanelResponse>(
        '/api/changeEmailPassword',
        {
          adminUser: this.adminUser,
          adminPass: this.adminPass,
          email: email,
          newPassword: newPassword,
        },
      );

      return response.data.status === 1;
    } catch (error) {
      this.logger.error(`Change password error: ${error.message}`);
      return false;
    }
  }

  /**
   * List all emails for domain
   */
  async listEmails(): Promise<Array<{ email: string; diskUsage?: string }>> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await this.client.post<CyberPanelResponse>(
        '/api/getEmailsForDomain',
        {
          adminUser: this.adminUser,
          adminPass: this.adminPass,
          domain: this.domain,
        },
      );

      const data = response.data;

      if (data.status === 1 && data.data) {
        if (Array.isArray(data.data)) {
          return data.data.map((item: any) => ({
            email: item.email || item,
            diskUsage: item.DiskUsage || item.diskUsage,
          }));
        }
        return [];
      }
      return [];
    } catch (error) {
      this.logger.error(`List emails error: ${error.message}`);
      return [];
    }
  }

  /**
   * Get SMTP/IMAP configuration
   */
  getMailServerConfig() {
    return {
      smtp: {
        host: this.smtpHost,
        port: 587,
        secure: false, // STARTTLS
      },
      smtpSsl: {
        host: this.smtpHost,
        port: 465,
        secure: true,
      },
      imap: {
        host: this.imapHost,
        port: 993,
        secure: true,
      },
      pop3: {
        host: this.imapHost,
        port: 995,
        secure: true,
      },
      domain: this.domain,
      webmail: `https://${this.smtpHost}/snappymail`,
    };
  }

  /**
   * Generate random strong password
   */
  generatePassword(length = 16): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Generate email username from name
   */
  generateEmailUsername(firstName: string, lastName: string): string {
    const clean = (str: string) =>
      str
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');

    const random = Math.random().toString(36).substring(2, 6);
    return `${clean(firstName)}.${clean(lastName)}.${random}`;
  }
}
