import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreateGroupDto, UpdateGroupDto, GroupQueryDto } from './dto/group.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGroupDto) {
    return this.prisma.group.create({
      data: {
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: {
        _count: { select: { passengers: true } },
      },
    });
  }

  async findAll(query: GroupQueryDto) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: { select: { passengers: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.group.count({ where }),
    ]);

    return {
      data: groups,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        passengers: {
          include: {
            email: { select: { address: true, isActive: true } },
          },
        },
        _count: { select: { passengers: true } },
      },
    });

    if (!group) {
      throw new NotFoundException('Grup bulunamadi');
    }

    return group;
  }

  async update(id: string, dto: UpdateGroupDto) {
    await this.findOne(id);

    return this.prisma.group.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: {
        _count: { select: { passengers: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // First, unlink all passengers from the group
    await this.prisma.passenger.updateMany({
      where: { groupId: id },
      data: { groupId: null },
    });

    return this.prisma.group.delete({
      where: { id },
    });
  }

  async addPassengers(id: string, passengerIds: string[]) {
    await this.findOne(id);

    await this.prisma.passenger.updateMany({
      where: { id: { in: passengerIds } },
      data: { groupId: id },
    });

    return this.findOne(id);
  }

  async removePassengers(id: string, passengerIds: string[]) {
    await this.findOne(id);

    await this.prisma.passenger.updateMany({
      where: { id: { in: passengerIds }, groupId: id },
      data: { groupId: null },
    });

    return this.findOne(id);
  }

  async getStats() {
    const [totalGroups, groupsWithPassengers, upcomingGroups] =
      await Promise.all([
        this.prisma.group.count(),
        this.prisma.group.count({
          where: { passengers: { some: {} } },
        }),
        this.prisma.group.count({
          where: { startDate: { gte: new Date() } },
        }),
      ]);

    return {
      totalGroups,
      groupsWithPassengers,
      upcomingGroups,
    };
  }
}
