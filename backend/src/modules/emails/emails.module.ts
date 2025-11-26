import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { MailServerService } from './mail-server.service';

@Module({
  controllers: [EmailsController],
  providers: [EmailsService, MailServerService],
  exports: [EmailsService, MailServerService],
})
export class EmailsModule {}
