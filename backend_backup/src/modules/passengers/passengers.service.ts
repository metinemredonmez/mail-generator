import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CreatePassengerDto, UpdatePassengerDto, PassengerQueryDto, Gender } from './dto/passenger.dto';
import { COLUMN_MAPPINGS, GENDER_MAPPINGS, ImportError } from './dto/import.dto';
import * as XLSX from 'xlsx';

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

  async bulkDelete(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new BadRequestException('Silinecek yolcu ID listesi bos');
    }

    // Önce ilişkili e-postaları bul
    const passengersWithEmails = await this.prisma.passenger.findMany({
      where: { id: { in: ids } },
      select: { id: true, email: { select: { id: true } } },
    });

    const emailIds = passengersWithEmails
      .filter((p) => p.email)
      .map((p) => p.email!.id);

    // Transaction ile sil
    await this.prisma.$transaction(async (tx) => {
      // İlişkili inbox itemları sil
      if (emailIds.length > 0) {
        await tx.inboxItem.deleteMany({
          where: { emailId: { in: emailIds } },
        });

        // E-postaları sil
        await tx.email.deleteMany({
          where: { id: { in: emailIds } },
        });
      }

      // Yolcuları sil
      await tx.passenger.deleteMany({
        where: { id: { in: ids } },
      });
    });

    return {
      deleted: ids.length,
      emailsDeleted: emailIds.length,
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

  // Excel/CSV Import
  async importFromFile(
    buffer: Buffer,
    mimetype: string,
    groupId?: string,
  ): Promise<{ imported: number; skipped: number; errors: ImportError[]; passengers: any[] }> {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

    if (rawData.length === 0) {
      throw new BadRequestException('Excel dosyasi bos veya okunamiyor');
    }

    const errors: ImportError[] = [];
    const passengersToCreate: CreatePassengerDto[] = [];

    // Sütun başlıklarını analiz et
    const headers = Object.keys(rawData[0]);
    const columnMap = this.detectColumns(headers);

    if (!columnMap.firstName || !columnMap.lastName) {
      throw new BadRequestException(
        'Excel dosyasinda Ad ve Soyad sutunlari bulunamadi. Lutfen sutun basliklarini kontrol edin.',
      );
    }

    // Grup kontrolü
    if (groupId) {
      const group = await this.prisma.group.findUnique({ where: { id: groupId } });
      if (!group) {
        throw new BadRequestException('Belirtilen grup bulunamadi');
      }
    }

    // Her satırı işle
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNum = i + 2; // Excel'de 1'den başlıyor + header satırı

      try {
        const passenger = this.parseRow(row, columnMap, groupId);

        // Validasyon
        if (!passenger.firstName?.trim()) {
          errors.push({ row: rowNum, message: 'Ad alani bos', data: row });
          continue;
        }
        if (!passenger.lastName?.trim()) {
          errors.push({ row: rowNum, message: 'Soyad alani bos', data: row });
          continue;
        }

        passengersToCreate.push(passenger);
      } catch (err) {
        errors.push({ row: rowNum, message: err.message, data: row });
      }
    }

    // Toplu oluştur
    if (passengersToCreate.length === 0) {
      return { imported: 0, skipped: errors.length, errors, passengers: [] };
    }

    const results = await this.prisma.$transaction(
      passengersToCreate.map((p) =>
        this.prisma.passenger.create({
          data: p,
          include: { group: true },
        }),
      ),
    );

    return {
      imported: results.length,
      skipped: errors.length,
      errors,
      passengers: results,
    };
  }

  private detectColumns(headers: string[]): Record<string, string | null> {
    const result: Record<string, string | null> = {};

    for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
      result[field] = null;
      for (const header of headers) {
        const normalizedHeader = header.trim().toLowerCase();
        if (aliases.some((alias) => alias.toLowerCase() === normalizedHeader)) {
          result[field] = header;
          break;
        }
      }
    }

    return result;
  }

  private parseRow(
    row: Record<string, any>,
    columnMap: Record<string, string | null>,
    groupId?: string,
  ): CreatePassengerDto {
    const getValue = (field: string): string | undefined => {
      const col = columnMap[field];
      if (!col) return undefined;
      const val = row[col];
      if (val === null || val === undefined || val === '') return undefined;
      return String(val).trim();
    };

    // Cinsiyet dönüşümü
    let gender: Gender | undefined = undefined;
    const genderRaw = getValue('gender');
    if (genderRaw) {
      const normalized = genderRaw.toLowerCase();
      const mappedGender = GENDER_MAPPINGS[normalized];
      if (mappedGender) {
        gender = mappedGender as Gender;
      }
    }

    // Doğum tarihi dönüşümü
    let birthDate: string | undefined = undefined;
    const birthRaw = getValue('birthDate');
    if (birthRaw) {
      // Excel tarih formatı veya string olabilir
      const date = new Date(birthRaw);
      if (!isNaN(date.getTime())) {
        birthDate = date.toISOString().split('T')[0];
      }
    }

    return {
      firstName: getValue('firstName') || '',
      lastName: getValue('lastName') || '',
      phone: getValue('phone'),
      passportNo: getValue('passportNo'),
      nationality: getValue('nationality'),
      birthDate,
      gender,
      notes: getValue('notes'),
      groupId,
    };
  }

  // Excel Export
  async exportToExcel(groupId?: string, format: 'xlsx' | 'csv' = 'xlsx'): Promise<Buffer> {
    const where: any = {};
    if (groupId) {
      where.groupId = groupId;
    }

    const passengers = await this.prisma.passenger.findMany({
      where,
      include: {
        email: {
          select: { address: true },
        },
        group: {
          select: { name: true },
        },
      },
      orderBy: [
        { group: { name: 'asc' } },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    const exportData = passengers.map((p) => ({
      Ad: p.firstName,
      Soyad: p.lastName,
      Telefon: p.phone || '',
      'Pasaport No': p.passportNo || '',
      Uyruk: p.nationality || '',
      'Dogum Tarihi': p.birthDate ? new Date(p.birthDate).toLocaleDateString('tr-TR') : '',
      Cinsiyet: p.gender === 'MALE' ? 'Erkek' : p.gender === 'FEMALE' ? 'Kadin' : '',
      Grup: p.group?.name || '',
      'E-posta': p.email?.address || '',
      Durum: this.translateNusukStatus(p.nusukStatus),
      Notlar: p.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Yolcular');

    // Sütun genişlikleri
    worksheet['!cols'] = [
      { width: 15 }, // Ad
      { width: 15 }, // Soyad
      { width: 18 }, // Telefon
      { width: 15 }, // Pasaport No
      { width: 10 }, // Uyruk
      { width: 15 }, // Dogum Tarihi
      { width: 10 }, // Cinsiyet
      { width: 20 }, // Grup
      { width: 35 }, // E-posta
      { width: 15 }, // Durum
      { width: 25 }, // Notlar
    ];

    const bookType = format === 'csv' ? 'csv' : 'xlsx';
    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType }));
  }

  private translateNusukStatus(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'Bekliyor',
      EMAIL_CREATED: 'E-posta Olusturuldu',
      CODE_RECEIVED: 'Kod Alindi',
      ACCOUNT_VERIFIED: 'Dogrulandi',
      COMPLETED: 'Tamamlandi',
      FAILED: 'Hata',
    };
    return statusMap[status] || status;
  }

  // Excel şablon oluştur
  generateTemplate(): Buffer {
    const templateData = [
      {
        Ad: 'Ahmet',
        Soyad: 'Yilmaz',
        Telefon: '+905551234567',
        'Pasaport No': 'U12345678',
        Uyruk: 'TR',
        'Dogum Tarihi': '1990-01-15',
        Cinsiyet: 'Erkek',
        Notlar: 'Ornek not',
      },
      {
        Ad: 'Fatma',
        Soyad: 'Demir',
        Telefon: '+905559876543',
        'Pasaport No': 'U87654321',
        Uyruk: 'TR',
        'Dogum Tarihi': '1985-06-20',
        Cinsiyet: 'Kadin',
        Notlar: '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Yolcular');

    // Sütun genişlikleri
    worksheet['!cols'] = [
      { width: 15 }, // Ad
      { width: 15 }, // Soyad
      { width: 18 }, // Telefon
      { width: 15 }, // Pasaport No
      { width: 10 }, // Uyruk
      { width: 15 }, // Dogum Tarihi
      { width: 10 }, // Cinsiyet
      { width: 25 }, // Notlar
    ];

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }
}
