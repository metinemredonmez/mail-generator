import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { CreateSettingDto, UpdateSettingDto, BulkUpdateSettingsDto } from './dto/setting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Tum ayarlari getir (key-value)' })
  getAll() {
    return this.settingsService.getAll();
  }

  @Get('raw')
  @ApiOperation({ summary: 'Tum ayarlari getir (detayli)' })
  getAllRaw() {
    return this.settingsService.getAllRaw();
  }

  @Get('mail-config')
  @ApiOperation({ summary: 'Mail konfigurasyonunu getir' })
  getMailConfig() {
    return this.settingsService.getMailConfig();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Tek ayar getir' })
  get(@Param('key') key: string) {
    return this.settingsService.get(key);
  }

  @Post()
  @ApiOperation({ summary: 'Yeni ayar olustur' })
  create(@Body() dto: CreateSettingDto) {
    return this.settingsService.set(dto.key, dto.value, dto.type);
  }

  @Put('bulk')
  @ApiOperation({ summary: 'Toplu ayar guncelle' })
  bulkUpdate(@Body() dto: BulkUpdateSettingsDto) {
    return this.settingsService.bulkUpdate(dto.settings);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Ayar guncelle' })
  update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    return this.settingsService.set(key, dto.value);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Ayar sil' })
  delete(@Param('key') key: string) {
    return this.settingsService.delete(key);
  }

  @Post('initialize')
  @ApiOperation({ summary: 'Varsayilan ayarlari yukle' })
  initialize() {
    return this.settingsService.initializeDefaults();
  }
}
