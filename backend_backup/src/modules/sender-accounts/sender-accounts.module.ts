import { Module } from '@nestjs/common';
import { SenderAccountsService } from './sender-accounts.service';
import { SenderAccountsController } from './sender-accounts.controller';

@Module({
  controllers: [SenderAccountsController],
  providers: [SenderAccountsService],
  exports: [SenderAccountsService],
})
export class SenderAccountsModule {}
