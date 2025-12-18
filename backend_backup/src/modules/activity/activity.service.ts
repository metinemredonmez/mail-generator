import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { ActivityQueryDto, CreateActivityDto, ActivityAction, ActivityEntity } from './dto/activity.dto';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  /**
   * Log an activity
   */
  async log(dto: CreateActivityDto) {
    return this.prisma.activityLog.create({
      data: {
        action: dto.action,
        entity: dto.entity,
        entityId: dto.entityId,
        details: dto.details || {},
        adminId: dto.adminId,
        ipAddress: dto.ipAddress,
        userAgent: dto.userAgent,
      },
    });
  }

  /**
   * Get activity logs with filters
   */
  async findAll(query: ActivityQueryDto) {
    const { search, action, entity, adminId, startDate, endDate, page = 1, limit = 50 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (entity) {
      where.entity = entity;
    }

    if (adminId) {
      where.adminId = adminId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        include: {
          admin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get activity for specific entity
   */
  async findByEntity(entity: ActivityEntity, entityId: string) {
    return this.prisma.activityLog.findMany({
      where: {
        entity,
        entityId,
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Get recent activity summary
   */
  async getRecentSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCount, weekCount, actionCounts] = await Promise.all([
      this.prisma.activityLog.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.activityLog.count({
        where: {
          createdAt: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.activityLog.groupBy({
        by: ['action'],
        _count: true,
        where: {
          createdAt: {
            gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      today: todayCount,
      thisWeek: weekCount,
      byAction: actionCounts.reduce((acc, item) => {
        acc[item.action] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Delete old logs (cleanup)
   */
  async deleteOldLogs(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.activityLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return { deleted: result.count };
  }

  // Helper methods for common logging
  async logPassengerCreate(passengerId: string, adminId?: string, details?: any) {
    return this.log({
      action: ActivityAction.PASSENGER_CREATE,
      entity: ActivityEntity.PASSENGER,
      entityId: passengerId,
      adminId,
      details,
    });
  }

  async logEmailCreate(emailId: string, passengerId: string, adminId?: string) {
    return this.log({
      action: ActivityAction.EMAIL_CREATE,
      entity: ActivityEntity.EMAIL,
      entityId: emailId,
      adminId,
      details: { passengerId },
    });
  }

  async logCodeFound(inboxItemId: string, code: string, codeType: string) {
    return this.log({
      action: ActivityAction.CODE_FOUND,
      entity: ActivityEntity.INBOX,
      entityId: inboxItemId,
      details: { code, codeType },
    });
  }

  async logLogin(adminId: string, ipAddress?: string, userAgent?: string) {
    return this.log({
      action: ActivityAction.LOGIN,
      entity: ActivityEntity.ADMIN,
      entityId: adminId,
      adminId,
      ipAddress,
      userAgent,
    });
  }
}
