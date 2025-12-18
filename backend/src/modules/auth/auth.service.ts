import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../config/prisma.service';
import { LoginDto, RegisterDto, AuthResponse, UpdateProfileDto, ChangePasswordDto } from './dto/auth.dto';

// Login attempt tracking için interface
interface LoginAttempt {
  count: number;
  lockedUntil: number | null;
}

@Injectable()
export class AuthService {
  // IP bazlı login attempt tracking
  private loginAttempts = new Map<string, LoginAttempt>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MS = 15 * 60 * 1000; // 15 dakika

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private checkLoginAttempts(ip: string): void {
    const attempt = this.loginAttempts.get(ip);

    if (attempt?.lockedUntil) {
      if (Date.now() < attempt.lockedUntil) {
        const remainingMinutes = Math.ceil((attempt.lockedUntil - Date.now()) / 60000);
        throw new UnauthorizedException(
          `Çok fazla başarısız deneme. ${remainingMinutes} dakika sonra tekrar deneyin.`
        );
      }
      // Kilit süresi dolmuş, sıfırla
      this.loginAttempts.delete(ip);
    }
  }

  private recordFailedAttempt(ip: string): void {
    const attempt = this.loginAttempts.get(ip) || { count: 0, lockedUntil: null };
    attempt.count += 1;

    if (attempt.count >= this.MAX_ATTEMPTS) {
      attempt.lockedUntil = Date.now() + this.LOCK_DURATION_MS;
    }

    this.loginAttempts.set(ip, attempt);
  }

  private clearLoginAttempts(ip: string): void {
    this.loginAttempts.delete(ip);
  }

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

  async login(dto: LoginDto, ip: string = 'unknown'): Promise<AuthResponse> {
    // Önce IP'nin kilitli olup olmadığını kontrol et
    this.checkLoginAttempts(ip);

    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email },
    });

    if (!admin) {
      this.recordFailedAttempt(ip);
      throw new UnauthorizedException('Gecersiz e-posta veya sifre');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Hesabiniz devre disi birakilmis');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, admin.password);

    if (!isPasswordValid) {
      this.recordFailedAttempt(ip);
      throw new UnauthorizedException('Gecersiz e-posta veya sifre');
    }

    // Başarılı giriş - attempt sayacını temizle
    this.clearLoginAttempts(ip);

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
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new UnauthorizedException('Kullanici bulunamadi');
    }

    return admin;
  }

  async updateProfile(adminId: string, dto: UpdateProfileDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new UnauthorizedException('Kullanici bulunamadi');
    }

    const updated = await this.prisma.admin.update({
      where: { id: adminId },
      data: {
        name: dto.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async changePassword(adminId: string, dto: ChangePasswordDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new UnauthorizedException('Kullanici bulunamadi');
    }

    // Mevcut sifre kontrolu
    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, admin.password);

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mevcut sifre yanlis');
    }

    // Yeni sifre hash
    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.admin.update({
      where: { id: adminId },
      data: {
        password: hashedPassword,
      },
    });

    // Activity log
    await this.prisma.activityLog.create({
      data: {
        action: 'CHANGE_PASSWORD',
        entity: 'Admin',
        entityId: adminId,
        adminId: adminId,
      },
    });

    return { message: 'Sifre basariyla degistirildi' };
  }

  private generateToken(adminId: string, email: string, role: string): string {
    return this.jwtService.sign({
      sub: adminId,
      email,
      role,
    });
  }
}
