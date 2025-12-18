import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InboxService } from './inbox.service';
import { InboxQueryDto, MarkReadDto, MockInboxItemDto } from './dto/inbox.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Inbox')
@Controller('inbox')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InboxController {
  constructor(private inboxService: InboxService) {}

  @Post('sync/:emailId')
  @ApiOperation({ summary: 'E-posta gelen kutusunu senkronize et' })
  syncInbox(@Param('emailId') emailId: string) {
    return this.inboxService.syncInbox(emailId);
  }

  @Post('sync-all')
  @ApiOperation({ summary: 'Tüm e-postaları senkronize et' })
  syncAllInboxes() {
    return this.inboxService.syncAllInboxes();
  }

  @Get('email/:emailId')
  @ApiOperation({ summary: 'E-posta gelen kutusu' })
  getInboxItems(
    @Param('emailId') emailId: string,
    @Query() query: InboxQueryDto,
  ) {
    return this.inboxService.getInboxItems(emailId, query);
  }

  @Get('codes')
  @ApiOperation({ summary: 'Tüm doğrulama kodları' })
  getAllVerificationCodes(@Query() query: InboxQueryDto) {
    return this.inboxService.getAllVerificationCodes(query);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Tüm gelen mesajlar' })
  getAllMessages(@Query() query: InboxQueryDto) {
    return this.inboxService.getAllMessages(query);
  }

  @Get('item/:itemId')
  @ApiOperation({ summary: 'Mesaj detayı' })
  getInboxItem(@Param('itemId') itemId: string) {
    return this.inboxService.getInboxItem(itemId);
  }

  @Post('item/:itemId/read')
  @ApiOperation({ summary: 'Mesajı okundu olarak işaretle' })
  markAsRead(@Param('itemId') itemId: string) {
    return this.inboxService.markAsRead(itemId);
  }

  @Patch(':itemId/mark-used')
  @ApiOperation({ summary: 'Doğrulama kodunu kullanıldı olarak işaretle' })
  markAsUsed(@Param('itemId') itemId: string) {
    return this.inboxService.markAsUsed(itemId);
  }

  @Post('mark-read')
  @ApiOperation({ summary: 'Birden fazla mesajı okundu olarak işaretle' })
  markMultipleAsRead(@Body() dto: MarkReadDto) {
    return this.inboxService.markMultipleAsRead(dto.itemIds);
  }

  @Post('mock/:emailId')
  @ApiOperation({ summary: 'Test için mock gelen mesaj ekle' })
  addMockInboxItem(
    @Param('emailId') emailId: string,
    @Body() dto: MockInboxItemDto,
  ) {
    return this.inboxService.addMockInboxItem(emailId, dto);
  }

  @Delete('item/:itemId')
  @ApiOperation({ summary: 'Mesajı sil' })
  deleteInboxItem(@Param('itemId') itemId: string) {
    return this.inboxService.deleteInboxItem(itemId);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Birden fazla mesajı sil' })
  deleteMultipleInboxItems(@Body() dto: MarkReadDto) {
    return this.inboxService.deleteMultipleInboxItems(dto.itemIds);
  }
}
