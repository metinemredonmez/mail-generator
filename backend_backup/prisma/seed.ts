import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// AES encryption for email passwords (same as crypto.util.ts)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function getKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

function encryptPassword(plainText: string, secretKey: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey(secretKey, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'dev-encryption-key-32-chars-min!';

// Demo UUID'ler (gercek UUID formatinda)
const DEMO_GROUP_ID = '00000000-0000-4000-8000-000000000001';
const DEMO_PASSENGER_IDS = {
  ahmet: '00000000-0000-4000-8000-000000000101',
  fatma: '00000000-0000-4000-8000-000000000102',
  mehmet: '00000000-0000-4000-8000-000000000103',
  ayse: '00000000-0000-4000-8000-000000000104',
  mustafa: '00000000-0000-4000-8000-000000000105',
};

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@mailpanel.com' },
    update: {},
    create: {
      email: 'admin@mailpanel.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Create demo group
  const group = await prisma.group.upsert({
    where: { id: DEMO_GROUP_ID },
    update: {},
    create: {
      id: DEMO_GROUP_ID,
      name: 'Ocak 2025 Umre Turu',
      description: 'Istanbul kalkisli umre turu',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-01-25'),
    },
  });
  console.log('✅ Group created:', group.name);

  // Create demo passengers
  const passengers = [
    {
      firstName: 'Ahmet',
      lastName: 'Yilmaz',
      phone: '+905551234567',
      passportNo: 'U12345678',
      nationality: 'TR',
      gender: 'MALE' as const,
    },
    {
      firstName: 'Fatma',
      lastName: 'Kaya',
      phone: '+905559876543',
      passportNo: 'U87654321',
      nationality: 'TR',
      gender: 'FEMALE' as const,
    },
    {
      firstName: 'Mehmet',
      lastName: 'Demir',
      phone: '+905551112233',
      passportNo: 'U11223344',
      nationality: 'TR',
      gender: 'MALE' as const,
    },
    {
      firstName: 'Ayse',
      lastName: 'Celik',
      phone: '+905554445566',
      passportNo: 'U44556677',
      nationality: 'TR',
      gender: 'FEMALE' as const,
    },
    {
      firstName: 'Mustafa',
      lastName: 'Sahin',
      phone: '+905557778899',
      passportNo: 'U77889900',
      nationality: 'TR',
      gender: 'MALE' as const,
    },
  ];

  for (const p of passengers) {
    const passengerId = DEMO_PASSENGER_IDS[p.firstName.toLowerCase() as keyof typeof DEMO_PASSENGER_IDS];
    const passenger = await prisma.passenger.upsert({
      where: { id: passengerId },
      update: {},
      create: {
        id: passengerId,
        ...p,
        groupId: group.id,
        nusukStatus: 'PENDING',
      },
    });
    console.log(`✅ Passenger created: ${passenger.firstName} ${passenger.lastName}`);
  }

  // Create sample email for first passenger (using AES encryption)
  const emailPassword = encryptPassword('test123', ENCRYPTION_KEY);
  const email = await prisma.email.upsert({
    where: { passengerId: DEMO_PASSENGER_IDS.ahmet },
    update: {},
    create: {
      address: 'ahmet.yilmaz@uzmanumre.com',
      password: emailPassword,
      passengerId: DEMO_PASSENGER_IDS.ahmet,
    },
  });
  console.log('✅ Sample email created:', email.address);

  // Update passenger status
  await prisma.passenger.update({
    where: { id: DEMO_PASSENGER_IDS.ahmet },
    data: { nusukStatus: 'EMAIL_CREATED' },
  });

  // Create sample inbox item with verification code
  await prisma.inboxItem.upsert({
    where: { messageId: 'sample-message-1' },
    update: {},
    create: {
      emailId: email.id,
      messageId: 'sample-message-1',
      subject: 'Nusuk Verification Code',
      fromAddress: 'noreply@nusuk.sa',
      fromName: 'Nusuk System',
      body: 'Dear User,\n\nYour verification code is: 847291\n\nThis code will expire in 10 minutes.\n\nBest regards,\nNusuk Team',
      verificationCode: '847291',
      codeType: 'NUSUK',
      isCodeUsed: false,
      receivedAt: new Date(),
    },
  });

  // Update passenger status
  await prisma.passenger.update({
    where: { id: DEMO_PASSENGER_IDS.ahmet },
    data: { nusukStatus: 'CODE_RECEIVED' },
  });
  console.log('✅ Sample inbox item created with code: 847291');

  // Create default settings
  const defaultSettings = [
    { key: 'mail_domain', value: 'uzmanumre.com', type: 'string' },
    { key: 'mail_provider', value: 'mock', type: 'string' },
    { key: 'smtp_host', value: 'mail.uzmanumre.com', type: 'string' },
    { key: 'smtp_port', value: '587', type: 'number' },
    { key: 'imap_host', value: 'mail.uzmanumre.com', type: 'string' },
    { key: 'imap_port', value: '993', type: 'number' },
  ];

  for (const setting of defaultSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('✅ Default settings created');

  console.log('\n🎉 Seeding completed!');
  console.log('');
  console.log('📧 Admin Login:');
  console.log('   Email: admin@mailpanel.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
