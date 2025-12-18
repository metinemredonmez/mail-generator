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
import { EmailsService } from './emails.service';
import { MailServerService } from './mail-server.service';
import { SmtpService } from './smtp.service';
import { CreateEmailDto, BulkCreateEmailDto, EmailQueryDto } from './dto/email.dto';
import { SendMailDto, SendToGroupDto, SendToPassengersDto, TestSmtpDto } from './dto/send-mail.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Emails')
@Controller('emails')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmailsController {
  constructor(
    private emailsService: EmailsService,
    private mailServerService: MailServerService,
    private smtpService: SmtpService,
  ) {}

  @Post('passenger/:passengerId')
  @ApiOperation({ summary: 'Yolcuya e-posta olustur' })
  createForPassenger(
    @Param('passengerId') passengerId: string,
    @Body() dto?: CreateEmailDto,
  ) {
    return this.emailsService.createForPassenger(passengerId, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Toplu e-posta olustur' })
  bulkCreate(@Body() dto: BulkCreateEmailDto) {
    return this.emailsService.bulkCreate(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Tum e-postalari listele' })
  findAll(@Query() query: EmailQueryDto) {
    return this.emailsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'E-posta istatistikleri' })
  getStats() {
    return this.emailsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'E-posta detayi' })
  findOne(@Param('id') id: string) {
    return this.emailsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'E-posta guncelle' })
  update(@Param('id') id: string, @Body() data: { isActive?: boolean }) {
    return this.emailsService.update(id, data);
  }

  @Get(':id/credentials')
  @ApiOperation({ summary: 'E-posta giris bilgileri' })
  getCredentials(@Param('id') id: string) {
    return this.emailsService.getCredentials(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'E-postayi devre disi birak' })
  deactivate(@Param('id') id: string) {
    return this.emailsService.deactivate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'E-postayi sil' })
  remove(@Param('id') id: string) {
    return this.emailsService.remove(id);
  }

  @Post('test-connection')
  @ApiOperation({ summary: 'Mail sunucu baglantisini test et' })
  testConnection() {
    return this.mailServerService.testConnection();
  }

  @Get('server-config')
  @ApiOperation({ summary: 'Mail sunucu konfigurasyonu' })
  getServerConfig() {
    return this.mailServerService.getConfig();
  }

  // ============ SMTP E-posta Gonderme Endpoint'leri ============

  @Post('send')
  @ApiOperation({ summary: 'E-posta gonder' })
  sendMail(@Body() dto: SendMailDto) {
    return this.smtpService.sendBulkMail(
      dto.senderAccountId,
      dto.recipients,
      dto.subject,
      { text: dto.text, html: dto.html },
    );
  }

  @Post('send/group')
  @ApiOperation({ summary: 'Gruba e-posta gonder' })
  sendToGroup(@Body() dto: SendToGroupDto) {
    return this.smtpService.sendToGroup(
      dto.senderAccountId,
      dto.groupId,
      dto.subject,
      { text: dto.text, html: dto.html },
    );
  }

  @Post('send/passengers')
  @ApiOperation({ summary: 'Secili yolculara e-posta gonder' })
  sendToPassengers(@Body() dto: SendToPassengersDto) {
    return this.smtpService.sendToPassengers(
      dto.senderAccountId,
      dto.passengerIds,
      dto.subject,
      { text: dto.text, html: dto.html },
    );
  }

  @Post('send/test')
  @ApiOperation({ summary: 'SMTP baglantisini test et' })
  testSmtp(@Body() dto: TestSmtpDto) {
    return this.smtpService.testConnection(dto.senderAccountId);
  }
}
