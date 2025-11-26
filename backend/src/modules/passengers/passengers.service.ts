import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreatePassengerDto, UpdatePassengerDto, PassengerQueryDto } from './dto/passenger.dto';

@Injectable()
export class PassengersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePassengerDto) {
    return this.prisma.passenger.create({
      data: dto,
      include: {
        email: true,
        group: true,
      },
    });
  }

  async findAll(query: PassengerQueryDto) {
    const { search, page = 1, limit = 20, hasEmail, groupId, nusukStatus } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { passportNo: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (hasEmail !== undefined) {
      where.email = hasEmail ? { isNot: null } : null;
    }

    if (groupId) {
      where.groupId = groupId;
    }

    if (nusukStatus) {
      where.nusukStatus = nusukStatus;
    }

    const [passengers, total] = await Promise.all([
      this.prisma.passenger.findMany({
        where,
        skip,
        take: limit,
        include: {
          email: {
            select: {
              id: true,
              address: true,
              isActive: true,
              lastChecked: true,
              _count: {
                select: { inboxItems: true },
              },
            },
          },
          group: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.passenger.count({ where }),
    ]);

    return {
      data: passengers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const passenger = await this.prisma.passenger.findUnique({
      where: { id },
      include: {
        email: {
          include: {
            inboxItems: {
              orderBy: { receivedAt: 'desc' },
              take: 10,
            },
          },
        },
        group: true,
        ravzaReservation: true,
      },
    });

    if (!passenger) {
      throw new NotFoundException('Yolcu bulunamadi');
    }

    return passenger;
  }

  async update(id: string, dto: UpdatePassengerDto) {
    await this.findOne(id);

    return this.prisma.passenger.update({
      where: { id },
      data: dto,
      include: {
        email: true,
        group: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.passenger.delete({
      where: { id },
    });
  }

  async bulkCreate(passengers: CreatePassengerDto[]) {
    const results = await this.prisma.$transaction(
      passengers.map((p) =>
        this.prisma.passenger.create({
          data: p,
        }),
      ),
    );

    return {
      created: results.length,
      passengers: results,
    };
  }

  async updateNusukStatus(id: string, status: string) {
    await this.findOne(id);

    return this.prisma.passenger.update({
      where: { id },
      data: { nusukStatus: status as any },
    });
  }

  async getStats() {
    const [
      totalPassengers,
      withEmail,
      withoutEmail,
      totalVerificationCodes,
      pendingCodes,
      statusCounts,
    ] = await Promise.all([
      this.prisma.passenger.count(),
      this.prisma.passenger.count({
        where: { email: { isNot: null } },
      }),
      this.prisma.passenger.count({
        where: { email: null },
      }),
      this.prisma.inboxItem.count({
        where: { verificationCode: { not: null } },
      }),
      this.prisma.inboxItem.count({
        where: {
          verificationCode: { not: null },
          isCodeUsed: false,
        },
      }),
      this.prisma.passenger.groupBy({
        by: ['nusukStatus'],
        _count: true,
      }),
    ]);

    return {
      totalPassengers,
      withEmail,
      withoutEmail,
      totalVerificationCodes,
      pendingCodes,
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item.nusukStatus] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
