import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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
    where: { id: 'demo-group-1' },
    update: {},
    create: {
      id: 'demo-group-1',
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
    const passenger = await prisma.passenger.upsert({
      where: { id: `demo-${p.firstName.toLowerCase()}` },
      update: {},
      create: {
        id: `demo-${p.firstName.toLowerCase()}`,
        ...p,
        groupId: group.id,
        nusukStatus: 'PENDING',
      },
    });
    console.log(`✅ Passenger created: ${passenger.firstName} ${passenger.lastName}`);
  }

  // Create sample email for first passenger
  const emailPassword = await bcrypt.hash('test123', 10);
  const email = await prisma.email.upsert({
    where: { passengerId: 'demo-ahmet' },
    update: {},
    create: {
      address: 'ahmet.yilmaz@mailpanel.com',
      password: emailPassword,
      passengerId: 'demo-ahmet',
    },
  });
  console.log('✅ Sample email created:', email.address);

  // Update passenger status
  await prisma.passenger.update({
    where: { id: 'demo-ahmet' },
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
    where: { id: 'demo-ahmet' },
    data: { nusukStatus: 'CODE_RECEIVED' },
  });
  console.log('✅ Sample inbox item created with code: 847291');

  // Create settings
  await prisma.setting.upsert({
    where: { key: 'mail_domain' },
    update: {},
    create: {
      key: 'mail_domain',
      value: 'mailpanel.com',
      type: 'string',
    },
  });

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
