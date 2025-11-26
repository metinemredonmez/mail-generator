import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../config/prisma.service';
import { LoginDto, RegisterDto, AuthResponse } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existingAdmin = await this.prisma.admin.findUnique({
      where: { email: dto.email },
    });

    if (existingAdmin) {
      throw new ConflictException('Bu e-posta adresi zaten kullaniliyor');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const admin = await this.prisma.admin.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: dto.role || 'OPERATOR',
      },
    });

    const token = this.generateToken(admin.id, admin.email, admin.role);

    return {
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      token,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email },
    });

    if (!admin) {
      throw new UnauthorizedException('Gecersiz e-posta veya sifre');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Hesabiniz devre disi birakilmis');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Gecersiz e-posta veya sifre');
    }

    const token = this.generateToken(admin.id, admin.email, admin.role);

    // Log activity
    await this.prisma.activityLog.create({
      data: {
        action: 'LOGIN',
        entity: 'Admin',
        entityId: admin.id,
        adminId: admin.id,
      },
    });

    return {
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      token,
    };
  }

  async getProfile(adminId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Kullanici bulunamadi');
    }

    return admin;
  }

  private generateToken(adminId: string, email: string, role: string): string {
    return this.jwtService.sign({
      sub: adminId,
      email,
      role,
    });
  }
}
