import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { MailServerService } from './mail-server.service';
import { CyberPanelService } from './cyberpanel.service';
import { SmtpService } from './smtp.service';

@Module({
  controllers: [EmailsController],
  providers: [EmailsService, MailServerService, CyberPanelService, SmtpService],
  exports: [EmailsService, MailServerService, CyberPanelService, SmtpService],
})
export class EmailsModule {}
