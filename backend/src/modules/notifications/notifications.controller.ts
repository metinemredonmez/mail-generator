import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Tum bildirimleri listele' })
  findAll(
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.notificationsService.findAll({
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit) : 20,
      page: page ? parseInt(page) : 1,
    });
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Okunmamis bildirim sayisi' })
  getUnreadCount() {
    return this.notificationsService.getUnreadCount();
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Bildirimi okundu olarak isaretle' })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Tum bildirimleri okundu olarak isaretle' })
  markAllAsRead() {
    return this.notificationsService.markAllAsRead();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Bildirimi sil' })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }

  @Delete('cleanup/:days')
  @ApiOperation({ summary: 'Eski bildirimleri temizle' })
  cleanup(@Param('days') days: string) {
    return this.notificationsService.cleanup(parseInt(days) || 30);
  }
}
