import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { NotificationType } from '@prisma/client';

interface CreateNotificationDto {
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  entityType?: string;
  entityId?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Yeni bildirim olustur
   */
  async create(dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: dto,
    });
  }

  /**
   * Tum bildirimleri getir
   */
  async findAll(params: { unreadOnly?: boolean; limit?: number; page?: number } = {}) {
    const { unreadOnly = false, limit = 20, page = 1 } = params;
    const skip = (page - 1) * limit;

    const where = unreadOnly ? { isRead: false } : {};

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { isRead: false } }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        unreadCount,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Okunmamis bildirim sayisi
   */
  async getUnreadCount() {
    const count = await this.prisma.notification.count({
      where: { isRead: false },
    });
    return { count };
  }

  /**
   * Bildirimi okundu olarak isaretle
   */
  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Tum bildirimleri okundu olarak isaretle
   */
  async markAllAsRead() {
    const result = await this.prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }

  /**
   * Bildirimi sil
   */
  async remove(id: string) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }

  /**
   * Eski bildirimleri temizle (30 gunluk)
   */
  async cleanup(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });

    this.logger.log(`Cleaned up ${result.count} old notifications`);
    return { deleted: result.count };
  }

  // ============================================
  // HELPER METHODS - Diger servislerden cagrilir
  // ============================================

  /**
   * Dogrulama kodu bildirimi
   */
  async notifyVerificationCode(
    passengerName: string,
    code: string,
    passengerId: string,
    emailId: string,
  ) {
    return this.create({
      type: 'VERIFICATION_CODE',
      title: 'Dogrulama Kodu Alindi',
      message: `${passengerName} icin dogrulama kodu: ${code}`,
      data: { passengerName, code, passengerId, emailId },
      entityType: 'passenger',
      entityId: passengerId,
    });
  }

  /**
   * Yeni e-posta bildirimi
   */
  async notifyNewEmail(
    passengerName: string,
    subject: string,
    passengerId: string,
    inboxItemId: string,
  ) {
    return this.create({
      type: 'NEW_EMAIL',
      title: 'Yeni E-posta',
      message: `${passengerName}: ${subject}`,
      data: { passengerName, subject, passengerId, inboxItemId },
      entityType: 'inbox',
      entityId: inboxItemId,
    });
  }

  /**
   * E-posta hesabi olusturuldu bildirimi
   */
  async notifyEmailCreated(passengerName: string, emailAddress: string, passengerId: string) {
    return this.create({
      type: 'EMAIL_CREATED',
      title: 'E-posta Olusturuldu',
      message: `${passengerName} icin ${emailAddress} olusturuldu`,
      data: { passengerName, emailAddress, passengerId },
      entityType: 'passenger',
      entityId: passengerId,
    });
  }

  /**
   * Toplu islem tamamlandi bildirimi
   */
  async notifyBulkComplete(operation: string, successCount: number, failCount: number) {
    return this.create({
      type: 'BULK_COMPLETE',
      title: 'Toplu Islem Tamamlandi',
      message: `${operation}: ${successCount} basarili${failCount > 0 ? `, ${failCount} basarisiz` : ''}`,
      data: { operation, successCount, failCount },
    });
  }

  /**
   * Senkronizasyon tamamlandi bildirimi
   */
  async notifySyncComplete(syncedCount: number, newCodesCount: number) {
    return this.create({
      type: 'SYNC_COMPLETE',
      title: 'Senkronizasyon Tamamlandi',
      message: `${syncedCount} e-posta senkronize edildi${newCodesCount > 0 ? `, ${newCodesCount} yeni kod bulundu` : ''}`,
      data: { syncedCount, newCodesCount },
    });
  }

  /**
   * Hata bildirimi
   */
  async notifyError(title: string, message: string, errorDetails?: any) {
    return this.create({
      type: 'ERROR',
      title,
      message,
      data: errorDetails,
    });
  }
}
