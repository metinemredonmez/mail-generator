import { Module } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { InboxController } from './inbox.controller';
import { ImapService } from './imap.service';
import { EmailsModule } from '../emails/emails.module';

@Module({
  imports: [EmailsModule],
  controllers: [InboxController],
  providers: [InboxService, ImapService],
  exports: [InboxService, ImapService],
})
export class InboxModule {}
