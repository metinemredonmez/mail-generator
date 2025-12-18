import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../config/prisma.service';
import { CryptoUtil } from '../../common/utils/crypto.util';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export interface BulkSendResult {
  success: Array<{ to: string; messageId: string }>;
  failed: Array<{ to: string; error: string }>;
  total: number;
  successCount: number;
  failedCount: number;
}

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);
  private readonly defaultSmtpHost: string;
  private readonly defaultSmtpPort: number;
  private readonly encryptionKey: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.defaultSmtpHost = configService.get<string>('SMTP_HOST') || 'server.uzmanumre.com';
    this.defaultSmtpPort = configService.get<number>('SMTP_PORT') || 587;
    const key = configService.get<string>('ENCRYPTION_KEY');
    if (!key) {
      throw new Error('ENCRYPTION_KEY is required');
    }
    this.encryptionKey = key;
  }

  /**
   * Create transporter for a sender account
   */
  private createTransporter(email: string, password: string, smtpHost?: string, smtpPort?: number) {
    const host = smtpHost || this.defaultSmtpHost;
    const port = smtpPort || this.defaultSmtpPort;

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user: email,
        pass: password,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Get sender account credentials
   */
  private async getSenderCredentials(senderAccountId: string) {
    const account = await this.prisma.senderAccount.findUnique({
      where: { id: senderAccountId },
    });

    if (!account) {
      throw new NotFoundException('Gonderici hesabi bulunamadi');
    }

    if (!account.isActive) {
      throw new Error('Gonderici hesabi aktif degil');
    }

    const password = CryptoUtil.decrypt(account.password, this.encryptionKey);

    return {
      name: account.name,
      email: account.email,
      password,
      smtpHost: account.smtpHost,
      smtpPort: account.smtpPort,
    };
  }

  /**
   * Send a single email
   */
  async sendMail(senderAccountId: string, options: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const sender = await this.getSenderCredentials(senderAccountId);
      const transporter = this.createTransporter(sender.email, sender.password, sender.smtpHost || undefined, sender.smtpPort || undefined);

      const recipients = Array.isArray(options.to) ? options.to.join(', ') : options.to;

      const info = await transporter.sendMail({
        from: `${sender.name} <${sender.email}>`,
        to: recipients,
        subject: options.subject,
        text: options.text,
        html: options.html,
        replyTo: options.replyTo,
      });

      this.logger.log(`Email sent: ${info.messageId} to ${recipients} from ${sender.email}`);

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send bulk emails
   */
  async sendBulkMail(
    senderAccountId: string,
    recipients: string[],
    subject: string,
    content: { text?: string; html?: string },
    options?: { delayMs?: number }
  ): Promise<BulkSendResult> {
    const result: BulkSendResult = {
      success: [],
      failed: [],
      total: recipients.length,
      successCount: 0,
      failedCount: 0,
    };

    const delayMs = options?.delayMs || 1000;

    for (const to of recipients) {
      const sendResult = await this.sendMail(senderAccountId, {
        to,
        subject,
        text: content.text,
        html: content.html,
      });

      if (sendResult.success) {
        result.success.push({ to, messageId: sendResult.messageId! });
        result.successCount++;
      } else {
        result.failed.push({ to, error: sendResult.error! });
        result.failedCount++;
      }

      if (recipients.indexOf(to) < recipients.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    this.logger.log(`Bulk send complete: ${result.successCount} success, ${result.failedCount} failed`);

    return result;
  }

  /**
   * Send to group
   */
  async sendToGroup(
    senderAccountId: string,
    groupId: string,
    subject: string,
    content: { text?: string; html?: string }
  ): Promise<BulkSendResult> {
    const passengers = await this.prisma.passenger.findMany({
      where: { groupId },
      include: { email: true },
    });

    const recipients = passengers
      .map(p => p.email?.address)
      .filter((email): email is string => !!email);

    if (recipients.length === 0) {
      return { success: [], failed: [], total: 0, successCount: 0, failedCount: 0 };
    }

    return this.sendBulkMail(senderAccountId, recipients, subject, content);
  }

  /**
   * Send to passengers
   */
  async sendToPassengers(
    senderAccountId: string,
    passengerIds: string[],
    subject: string,
    content: { text?: string; html?: string }
  ): Promise<BulkSendResult> {
    const passengers = await this.prisma.passenger.findMany({
      where: { id: { in: passengerIds } },
      include: { email: true },
    });

    const recipients = passengers
      .map(p => p.email?.address)
      .filter((email): email is string => !!email);

    if (recipients.length === 0) {
      return { success: [], failed: [], total: 0, successCount: 0, failedCount: 0 };
    }

    return this.sendBulkMail(senderAccountId, recipients, subject, content);
  }

  /**
   * Test SMTP connection
   */
  async testConnection(senderAccountId: string): Promise<{ success: boolean; message: string }> {
    try {
      const sender = await this.getSenderCredentials(senderAccountId);
      const transporter = this.createTransporter(sender.email, sender.password, sender.smtpHost || undefined, sender.smtpPort || undefined);

      await transporter.verify();

      return { success: true, message: `SMTP baglantisi basarili: ${sender.email}` };
    } catch (error) {
      return { success: false, message: `SMTP baglanti hatasi: ${error.message}` };
    }
  }
}
