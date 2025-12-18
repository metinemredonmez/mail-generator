import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { ImapService } from './imap.service';
import { EmailsService } from '../emails/emails.service';
import { NotificationsService } from '../notifications/notifications.service';
import { InboxQueryDto } from './dto/inbox.dto';
import { CodeType } from '@prisma/client';

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    private prisma: PrismaService,
    private imapService: ImapService,
    private emailsService: EmailsService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Fetch and sync inbox for a specific email
   */
  async syncInbox(emailId: string) {
    const email = await this.prisma.email.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      throw new NotFoundException('E-posta bulunamadı');
    }

    try {
      // For mock/development, skip actual IMAP fetch
      if (process.env.MAIL_PROVIDER === 'mock') {
        this.logger.log(`[MOCK] Syncing inbox for: ${email.address}`);

        // Update last checked timestamp
        await this.prisma.email.update({
          where: { id: emailId },
          data: { lastChecked: new Date() },
        });

        return {
          synced: 0,
          message: 'Mock mode - no actual sync performed',
        };
      }

      // Decrypt password for IMAP connection
      let plainPassword: string;
      try {
        plainPassword = this.emailsService.decryptPassword(email.password);
      } catch (err) {
        this.logger.error(`Failed to decrypt password for ${email.address}`);
        return { synced: 0, message: 'Password decryption failed - old format?' };
      }

      // Real IMAP sync
      const messages = await this.imapService.fetchEmails(email.address, plainPassword, {
        unseen: true,
        limit: 50,
      });

      let synced = 0;
      for (const msg of messages) {
        // Check if message already exists
        const existing = await this.prisma.inboxItem.findUnique({
          where: { messageId: msg.messageId },
        });

        if (!existing) {
          // Extract verification code
          const codeExtracted = this.imapService.extractVerificationCode(msg.body);

          await this.prisma.inboxItem.create({
            data: {
              emailId,
              messageId: msg.messageId,
              subject: msg.subject,
              fromAddress: msg.from,
              body: msg.body,
              htmlBody: msg.htmlBody,
              verificationCode: codeExtracted?.code,
              codeType: codeExtracted?.type as CodeType,
              receivedAt: msg.receivedAt,
            },
          });

          synced++;

          // If code found, update passenger status and send notification
          if (codeExtracted?.code) {
            const emailWithPassenger = await this.prisma.email.findUnique({
              where: { id: emailId },
              include: { passenger: true },
            });

            if (emailWithPassenger?.passenger) {
              await this.prisma.passenger.update({
                where: { id: emailWithPassenger.passenger.id },
                data: { nusukStatus: 'CODE_RECEIVED' },
              });

              // Dogrulama kodu bildirimi gonder
              const passengerName = `${emailWithPassenger.passenger.firstName} ${emailWithPassenger.passenger.lastName}`;
              await this.notificationsService.notifyVerificationCode(
                passengerName,
                codeExtracted.code,
                emailWithPassenger.passenger.id,
                emailId,
              );
            }
          }
        }
      }

      await this.prisma.email.update({
        where: { id: emailId },
        data: { lastChecked: new Date() },
      });

      return { synced, message: `Synced ${synced} new messages` };
    } catch (error) {
      this.logger.error(`Failed to sync inbox: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync all active email inboxes
   */
  async syncAllInboxes() {
    const emails = await this.prisma.email.findMany({
      where: { isActive: true },
    });

    const results = {
      total: emails.length,
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const email of emails) {
      try {
        await this.syncInbox(email.id);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${email.address}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Get inbox items for an email
   */
  async getInboxItems(emailId: string, query: InboxQueryDto) {
    const { page = 1, limit = 20, hasCode, unreadOnly } = query;
    const skip = (page - 1) * limit;

    const where: any = { emailId };

    if (hasCode !== undefined) {
      where.verificationCode = hasCode ? { not: null } : null;
    }

    if (unreadOnly) {
      where.isRead = false;
    }

    const [items, total] = await Promise.all([
      this.prisma.inboxItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedAt: 'desc' },
      }),
      this.prisma.inboxItem.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all messages across all emails
   */
  async getAllMessages(query: InboxQueryDto) {
    const { page = 1, limit = 20, unreadOnly } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (unreadOnly) {
      where.isRead = false;
    }

    const [items, total] = await Promise.all([
      this.prisma.inboxItem.findMany({
        where,
        skip,
        take: limit,
        include: {
          email: {
            include: {
              passenger: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { receivedAt: 'desc' },
      }),
      this.prisma.inboxItem.count({ where }),
    ]);

    return {
      data: items.map((item: any) => ({
        id: item.id,
        messageId: item.messageId,
        subject: item.subject,
        fromAddress: item.fromAddress,
        fromName: item.fromName,
        body: item.body,
        htmlBody: item.htmlBody,
        verificationCode: item.verificationCode,
        codeType: item.codeType,
        isRead: item.isRead,
        receivedAt: item.receivedAt,
        email: item.email?.address,
        passenger: item.email?.passenger,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get all verification codes across all emails
   */
  async getAllVerificationCodes(query: InboxQueryDto) {
    const { page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.inboxItem.findMany({
        where: {
          verificationCode: { not: null },
        },
        skip,
        take: limit,
        include: {
          email: {
            include: {
              passenger: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { receivedAt: 'desc' },
      }),
      this.prisma.inboxItem.count({
        where: { verificationCode: { not: null } },
      }),
    ]);

    return {
      data: items.map((item: any) => ({
        id: item.id,
        code: item.verificationCode,
        codeType: item.codeType,
        email: item.email?.address,
        passenger: item.email?.passenger,
        subject: item.subject,
        receivedAt: item.receivedAt,
        isRead: item.isRead,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark inbox item as read
   */
  async markAsRead(itemId: string) {
    return this.prisma.inboxItem.update({
      where: { id: itemId },
      data: { isRead: true },
    });
  }

  /**
   * Mark verification code as used
   */
  async markAsUsed(itemId: string) {
    const item = await this.prisma.inboxItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Mesaj bulunamadı');
    }

    return this.prisma.inboxItem.update({
      where: { id: itemId },
      data: { isCodeUsed: true },
    });
  }

  /**
   * Mark multiple items as read
   */
  async markMultipleAsRead(itemIds: string[]) {
    return this.prisma.inboxItem.updateMany({
      where: { id: { in: itemIds } },
      data: { isRead: true },
    });
  }

  /**
   * Get inbox item detail
   */
  async getInboxItem(itemId: string) {
    const item = await this.prisma.inboxItem.findUnique({
      where: { id: itemId },
      include: {
        email: {
          include: {
            passenger: true,
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Mesaj bulunamadı');
    }

    return item;
  }

  /**
   * Add mock inbox item (for testing)
   */
  async addMockInboxItem(
    emailId: string,
    data: {
      subject: string;
      from: string;
      body: string;
      code?: string;
    },
  ) {
    const codeExtracted = data.code
      ? { code: data.code, type: 'NUSUK' }
      : this.imapService.extractVerificationCode(data.body);

    return this.prisma.inboxItem.create({
      data: {
        emailId,
        messageId: `mock-${Date.now()}`,
        subject: data.subject,
        fromAddress: data.from,
        body: data.body,
        verificationCode: codeExtracted?.code,
        codeType: codeExtracted?.type as CodeType,
        receivedAt: new Date(),
      },
    });
  }
}
