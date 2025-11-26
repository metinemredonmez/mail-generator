import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { ImapService } from './imap.service';
import { InboxQueryDto } from './dto/inbox.dto';
import { CodeType } from '@prisma/client';

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    private prisma: PrismaService,
    private imapService: ImapService,
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

    // Note: In production, you'd need to store password in reversible encryption
    // For now, this is a placeholder - IMAP needs plain password
    // You might want to use a secrets manager like AWS Secrets Manager

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

      // Real IMAP sync would go here
      // const messages = await this.imapService.fetchEmails(email.address, plainPassword);
      // ... process and save messages

      await this.prisma.email.update({
        where: { id: emailId },
        data: { lastChecked: new Date() },
      });

      return { synced: 0, message: 'IMAP sync not configured' };
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
