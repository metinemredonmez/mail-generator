import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;
}

export class RegisterDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;

  @ApiProperty({ example: 'Admin User' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: ['ADMIN', 'OPERATOR'] })
  @IsOptional()
  @IsEnum(['ADMIN', 'OPERATOR'])
  role?: 'ADMIN' | 'OPERATOR';
}

export class AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'Yeni Ad Soyad' })
  @IsString()
  @IsOptional()
  name?: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'mevcutSifre123' })
  @IsString()
  @MinLength(6, { message: 'Mevcut sifre en az 6 karakter olmalidir' })
  currentPassword: string;

  @ApiProperty({ example: 'yeniSifre123' })
  @IsString()
  @MinLength(6, { message: 'Yeni sifre en az 6 karakter olmalidir' })
  newPassword: string;
}
