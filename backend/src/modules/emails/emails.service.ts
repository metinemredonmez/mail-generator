import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { MailServerService } from './mail-server.service';
import { CreateEmailDto, BulkCreateEmailDto, EmailQueryDto } from './dto/email.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class EmailsService {
  constructor(
    private prisma: PrismaService,
    private mailServer: MailServerService,
  ) {}

  /**
   * Create email for a specific passenger
   */
  async createForPassenger(passengerId: string, dto?: CreateEmailDto) {
    // Check if passenger exists
    const passenger = await this.prisma.passenger.findUnique({
      where: { id: passengerId },
      include: { email: true },
    });

    if (!passenger) {
      throw new NotFoundException('Yolcu bulunamadı');
    }

    if (passenger.email) {
      throw new ConflictException('Bu yolcunun zaten bir e-postası var');
    }

    // Generate username or use custom
    const username =
      dto?.customUsername ||
      this.mailServer.generateUsername(passenger.firstName, passenger.lastName);

    // Create mailbox on mail server
    const result = await this.mailServer.createMailbox(
      username,
      `${passenger.firstName} ${passenger.lastName}`,
    );

    if (!result.success) {
      throw new BadRequestException(
        `Mail oluşturulamadı: ${result.error || 'Bilinmeyen hata'}`,
      );
    }

    // Encrypt password before storing
    const encryptedPassword = await bcrypt.hash(result.password, 10);

    // Save to database
    const email = await this.prisma.email.create({
      data: {
        address: result.email,
        password: encryptedPassword,
        passengerId,
      },
      include: {
        passenger: true,
      },
    });

    return {
      ...email,
      // Return plain password only on creation
      plainPassword: result.password,
    };
  }

  /**
   * Bulk create emails for multiple passengers
   */
  async bulkCreate(dto: BulkCreateEmailDto) {
    const results = {
      success: [] as any[],
      failed: [] as any[],
    };

    for (const passengerId of dto.passengerIds) {
      try {
        const email = await this.createForPassenger(passengerId);
        results.success.push({
          passengerId,
          email: email.address,
          password: email.plainPassword,
        });
      } catch (error) {
        results.failed.push({
          passengerId,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Get all emails
   */
  async findAll(query: EmailQueryDto) {
    const { search, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { address: { contains: search, mode: 'insensitive' } },
        { passenger: { firstName: { contains: search, mode: 'insensitive' } } },
        { passenger: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [emails, total] = await Promise.all([
      this.prisma.email.findMany({
        where,
        skip,
        take: limit,
        include: {
          passenger: true,
          _count: {
            select: { inboxItems: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.email.count({ where }),
    ]);

    return {
      data: emails,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get email by ID
   */
  async findOne(id: string) {
    const email = await this.prisma.email.findUnique({
      where: { id },
      include: {
        passenger: true,
        inboxItems: {
          orderBy: { receivedAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!email) {
      throw new NotFoundException('E-posta bulunamadı');
    }

    return email;
  }

  /**
   * Get email password (for manual login)
   * Returns decrypted password
   */
  async getCredentials(id: string) {
    const email = await this.prisma.email.findUnique({
      where: { id },
      select: {
        address: true,
        password: true,
      },
    });

    if (!email) {
      throw new NotFoundException('E-posta bulunamadı');
    }

    // Note: In production, you might want to store the password
    // in a reversible encryption, not bcrypt hash
    // For now, we return what we have
    return {
      email: email.address,
      // Password is hashed, so we can't return plain text
      // This would need a different encryption approach
      note: 'Şifre hashlenmiş durumda. Orijinal şifre sadece oluşturma sırasında gösterilir.',
    };
  }

  /**
   * Deactivate email
   */
  async deactivate(id: string) {
    const email = await this.findOne(id);

    return this.prisma.email.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Delete email
   */
  async remove(id: string) {
    const email = await this.findOne(id);

    // Delete from mail server
    await this.mailServer.deleteMailbox(email.address);

    // Delete from database
    return this.prisma.email.delete({
      where: { id },
    });
  }

  /**
   * Get email statistics
   */
  async getStats() {
    const [total, active, inactive, withCodes] = await Promise.all([
      this.prisma.email.count(),
      this.prisma.email.count({ where: { isActive: true } }),
      this.prisma.email.count({ where: { isActive: false } }),
      this.prisma.email.count({
        where: {
          inboxItems: {
            some: { verificationCode: { not: null } },
          },
        },
      }),
    ]);

    return { total, active, inactive, withCodes };
  }
}
