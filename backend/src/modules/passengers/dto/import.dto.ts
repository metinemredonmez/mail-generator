import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class ImportPassengersDto {
  @ApiPropertyOptional({ description: 'Yolcuları eklenecek grup ID' })
  @IsUUID()
  @IsOptional()
  groupId?: string;
}

export class ImportResultDto {
  @ApiProperty({ description: 'Başarıyla eklenen yolcu sayısı' })
  imported: number;

  @ApiProperty({ description: 'Atlanan (hatalı) satır sayısı' })
  skipped: number;

  @ApiProperty({ description: 'Hatalar listesi' })
  errors: ImportError[];

  @ApiProperty({ description: 'Eklenen yolcular' })
  passengers: any[];
}

export class ImportError {
  @ApiProperty({ description: 'Satır numarası' })
  row: number;

  @ApiProperty({ description: 'Hata mesajı' })
  message: string;

  @ApiProperty({ description: 'Satır verisi' })
  data?: any;
}

// Excel sütun mapping - Türkçe ve İngilizce destekli
export const COLUMN_MAPPINGS = {
  // Ad
  firstName: ['Ad', 'İsim', 'FirstName', 'First Name', 'ad', 'isim', 'firstname', 'first_name'],
  // Soyad
  lastName: ['Soyad', 'Soyadı', 'LastName', 'Last Name', 'soyad', 'soyadı', 'lastname', 'last_name'],
  // Telefon
  phone: ['Telefon', 'Tel', 'Phone', 'Mobile', 'telefon', 'tel', 'phone', 'mobile', 'cep'],
  // Pasaport
  passportNo: ['Pasaport', 'Pasaport No', 'Passport', 'PassportNo', 'Passport No', 'pasaport', 'passport_no'],
  // Uyruk
  nationality: ['Uyruk', 'Nationality', 'Ülke', 'uyruk', 'nationality', 'ulke'],
  // Doğum Tarihi
  birthDate: ['Doğum Tarihi', 'DogumTarihi', 'Birth Date', 'BirthDate', 'dogum_tarihi', 'birthdate', 'birth_date'],
  // Cinsiyet
  gender: ['Cinsiyet', 'Gender', 'cinsiyet', 'gender'],
  // Notlar
  notes: ['Not', 'Notlar', 'Notes', 'Açıklama', 'not', 'notlar', 'notes', 'aciklama'],
};

// Cinsiyet değeri dönüştürme
export const GENDER_MAPPINGS: Record<string, 'MALE' | 'FEMALE'> = {
  erkek: 'MALE',
  kadın: 'FEMALE',
  kadin: 'FEMALE',
  male: 'MALE',
  female: 'FEMALE',
  m: 'MALE',
  f: 'FEMALE',
  e: 'MALE',
  k: 'FEMALE',
  bay: 'MALE',
  bayan: 'FEMALE',
};
