import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CyberPanelService } from './cyberpanel.service';
import * as crypto from 'crypto';

interface CreateMailboxResult {
  email: string;
  password: string;
  success: boolean;
  error?: string;
}

@Injectable()
export class MailServerService {
  private readonly logger = new Logger(MailServerService.name);
  private readonly provider: string;
  private readonly domain: string;

  constructor(
    private configService: ConfigService,
    private cyberPanelService: CyberPanelService,
  ) {
    this.provider = configService.get<string>('MAIL_PROVIDER') || 'mock';
    this.domain = configService.get<string>('MAIL_DOMAIN') || 'uzmanumre.com';
  }

  /**
   * Generate a secure random password
   */
  generatePassword(length = 16): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      password += chars[randomBytes[i] % chars.length];
    }
    return password;
  }

  /**
   * Generate email username from passenger info
   */
  generateUsername(name: string, surname: string, index?: number): string {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanSurname = surname.toLowerCase().replace(/[^a-z0-9]/g, '');
    const suffix = index ? index.toString() : '';
    return `${cleanName}.${cleanSurname}${suffix}`;
  }

  /**
   * Create a new mailbox
   */
  async createMailbox(
    username: string,
    displayName?: string,
  ): Promise<CreateMailboxResult> {
    const email = `${username}@${this.domain}`;
    const password = this.generatePassword();

    try {
      switch (this.provider) {
        case 'cyberpanel':
          return await this.createCyberPanelMailbox(username, password, displayName);

        case 'zoho':
          return await this.createZohoMailbox(email, password, displayName);

        case 'custom':
          return await this.createCustomMailbox(email, password, displayName);

        case 'mock':
        default:
          // Mock implementation for development
          this.logger.log(`[MOCK] Creating mailbox: ${email}`);
          return {
            email,
            password,
            success: true,
          };
      }
    } catch (error) {
      this.logger.error(`Failed to create mailbox: ${error.message}`);
      return {
        email,
        password: '',
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete a mailbox
   */
  async deleteMailbox(email: string): Promise<boolean> {
    try {
      switch (this.provider) {
        case 'cyberpanel':
          return await this.cyberPanelService.deleteEmail(email);

        case 'zoho':
          return await this.deleteZohoMailbox(email);

        case 'custom':
          return await this.deleteCustomMailbox(email);

        case 'mock':
        default:
          this.logger.log(`[MOCK] Deleting mailbox: ${email}`);
          return true;
      }
    } catch (error) {
      this.logger.error(`Failed to delete mailbox: ${error.message}`);
      return false;
    }
  }

  // ============ CyberPanel Implementation ============

  private async createCyberPanelMailbox(
    username: string,
    password: string,
    displayName?: string,
  ): Promise<CreateMailboxResult> {
    const result = await this.cyberPanelService.createEmail(username, password);

    if (result.success) {
      return {
        email: result.email!,
        password: result.password!,
        success: true,
      };
    }

    return {
      email: `${username}@${this.domain}`,
      password: '',
      success: false,
      error: result.error,
    };
  }

  /**
   * Test mail server connection
   */
  async testConnection(): Promise<{ success: boolean; message: string; provider: string }> {
    switch (this.provider) {
      case 'cyberpanel':
        const result = await this.cyberPanelService.testConnection();
        return { ...result, provider: 'cyberpanel' };

      case 'mock':
      default:
        return {
          success: true,
          message: 'Mock provider - always connected',
          provider: 'mock',
        };
    }
  }

  /**
   * Get mail server configuration
   */
  getConfig() {
    switch (this.provider) {
      case 'cyberpanel':
        return this.cyberPanelService.getMailServerConfig();

      default:
        return {
          smtp: { host: `mail.${this.domain}`, port: 587 },
          imap: { host: `mail.${this.domain}`, port: 993 },
        };
    }
  }

  // ============ Zoho Mail Implementation ============

  private async createZohoMailbox(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<CreateMailboxResult> {
    const orgId = this.configService.get<string>('ZOHO_ORGANIZATION_ID');
    const authToken = this.configService.get<string>('ZOHO_AUTH_TOKEN');

    if (!orgId || !authToken) {
      throw new Error('Zoho credentials not configured');
    }

    // Zoho Mail API call
    // Documentation: https://www.zoho.com/mail/help/api/
    const response = await fetch(
      `https://mail.zoho.com/api/organization/${orgId}/accounts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primaryEmailAddress: email,
          password,
          displayName: displayName || email.split('@')[0],
          role: 'member',
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Zoho API error');
    }

    return { email, password, success: true };
  }

  private async deleteZohoMailbox(email: string): Promise<boolean> {
    const orgId = this.configService.get<string>('ZOHO_ORGANIZATION_ID');
    const authToken = this.configService.get<string>('ZOHO_AUTH_TOKEN');

    if (!orgId || !authToken) {
      throw new Error('Zoho credentials not configured');
    }

    const response = await fetch(
      `https://mail.zoho.com/api/organization/${orgId}/accounts/${email}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Zoho-oauthtoken ${authToken}`,
        },
      },
    );

    return response.ok;
  }

  // ============ Custom Mail Server Implementation ============

  private async createCustomMailbox(
    email: string,
    password: string,
    displayName?: string,
  ): Promise<CreateMailboxResult> {
    const apiUrl = this.configService.get<string>('MAIL_API_URL');
    const apiKey = this.configService.get<string>('MAIL_API_KEY');

    if (!apiUrl || !apiKey) {
      throw new Error('Custom mail server not configured');
    }

    // Generic mail server API call
    const response = await fetch(`${apiUrl}/mailboxes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name: displayName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Mail server API error');
    }

    return { email, password, success: true };
  }

  private async deleteCustomMailbox(email: string): Promise<boolean> {
    const apiUrl = this.configService.get<string>('MAIL_API_URL');
    const apiKey = this.configService.get<string>('MAIL_API_KEY');

    if (!apiUrl || !apiKey) {
      throw new Error('Custom mail server not configured');
    }

    const response = await fetch(`${apiUrl}/mailboxes/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    return response.ok;
  }
}
