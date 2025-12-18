import { Controller, Get, Delete, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { ActivityQueryDto, ActivityEntity } from './dto/activity.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Activity')
@Controller('activity')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get()
  @ApiOperation({ summary: 'Aktivite loglarini listele' })
  findAll(@Query() query: ActivityQueryDto) {
    return this.activityService.findAll(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Aktivite ozeti' })
  getSummary() {
    return this.activityService.getRecentSummary();
  }

  @Get('entity/:entity/:entityId')
  @ApiOperation({ summary: 'Belirli bir entity icin aktivite logları' })
  findByEntity(
    @Param('entity') entity: ActivityEntity,
    @Param('entityId') entityId: string,
  ) {
    return this.activityService.findByEntity(entity, entityId);
  }

  @Delete('cleanup/:days')
  @ApiOperation({ summary: 'Eski loglari temizle' })
  cleanup(@Param('days') days: string) {
    return this.activityService.deleteOldLogs(parseInt(days) || 90);
  }
}
