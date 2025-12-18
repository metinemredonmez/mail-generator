import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SenderAccountsService } from './sender-accounts.service';
import { CreateSenderAccountDto, UpdateSenderAccountDto } from './dto/sender-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Sender Accounts')
@Controller('sender-accounts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SenderAccountsController {
  constructor(private senderAccountsService: SenderAccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni gonderici hesabi ekle' })
  create(@Body() dto: CreateSenderAccountDto) {
    return this.senderAccountsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Tum gonderici hesaplarini listele' })
  findAll() {
    return this.senderAccountsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Gonderici hesabi detayi' })
  findOne(@Param('id') id: string) {
    return this.senderAccountsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Gonderici hesabini guncelle' })
  update(@Param('id') id: string, @Body() dto: UpdateSenderAccountDto) {
    return this.senderAccountsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Gonderici hesabini sil' })
  remove(@Param('id') id: string) {
    return this.senderAccountsService.remove(id);
  }
}
