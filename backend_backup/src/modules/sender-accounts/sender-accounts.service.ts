import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/prisma.service';
import { CryptoUtil } from '../../common/utils/crypto.util';
import { CreateSenderAccountDto, UpdateSenderAccountDto } from './dto/sender-account.dto';

@Injectable()
export class SenderAccountsService {
  private readonly encryptionKey: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const key = configService.get<string>('ENCRYPTION_KEY');
    if (!key) {
      throw new Error('ENCRYPTION_KEY is required');
    }
    this.encryptionKey = key;
  }

  async create(dto: CreateSenderAccountDto) {
    // Check if email already exists
    const existing = await this.prisma.senderAccount.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Bu e-posta adresi zaten kayitli');
    }

    // Encrypt password
    const encryptedPassword = CryptoUtil.encrypt(dto.password, this.encryptionKey);

    // If this is set as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.senderAccount.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.senderAccount.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: encryptedPassword,
        smtpHost: dto.smtpHost,
        smtpPort: dto.smtpPort,
        isDefault: dto.isDefault || false,
      },
    });
  }

  async findAll() {
    return this.prisma.senderAccount.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        name: true,
        email: true,
        smtpHost: true,
        smtpPort: true,
        isActive: true,
        isDefault: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const account = await this.prisma.senderAccount.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        smtpHost: true,
        smtpPort: true,
        isActive: true,
        isDefault: true,
        createdAt: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Gonderici hesabi bulunamadi');
    }

    return account;
  }

  async getCredentials(id: string) {
    const account = await this.prisma.senderAccount.findUnique({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException('Gonderici hesabi bulunamadi');
    }

    const decryptedPassword = CryptoUtil.decrypt(account.password, this.encryptionKey);

    return {
      email: account.email,
      password: decryptedPassword,
      smtpHost: account.smtpHost || this.configService.get('SMTP_HOST'),
      smtpPort: account.smtpPort || this.configService.get('SMTP_PORT'),
    };
  }

  async update(id: string, dto: UpdateSenderAccountDto) {
    await this.findOne(id);

    const data: any = { ...dto };

    // If password is being updated, encrypt it
    if (dto.password) {
      data.password = CryptoUtil.encrypt(dto.password, this.encryptionKey);
    }

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.senderAccount.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.senderAccount.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        smtpHost: true,
        smtpPort: true,
        isActive: true,
        isDefault: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.senderAccount.delete({ where: { id } });
  }

  async getDefault() {
    return this.prisma.senderAccount.findFirst({
      where: { isDefault: true, isActive: true },
    });
  }
}
