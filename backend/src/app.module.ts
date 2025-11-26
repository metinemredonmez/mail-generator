import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { PassengersModule } from './modules/passengers/passengers.module';
import { EmailsModule } from './modules/emails/emails.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { GroupsModule } from './modules/groups/groups.module';
import { HealthModule } from './modules/health/health.module';
import { PrismaModule } from './config/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    PassengersModule,
    EmailsModule,
    InboxModule,
    GroupsModule,
  ],
})
export class AppModule {}
