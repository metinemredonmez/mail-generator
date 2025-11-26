import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmailsService } from './emails.service';
import { CreateEmailDto, BulkCreateEmailDto, EmailQueryDto } from './dto/email.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Emails')
@Controller('emails')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EmailsController {
  constructor(private emailsService: EmailsService) {}

  @Post('passenger/:passengerId')
  @ApiOperation({ summary: 'Yolcuya e-posta oluştur' })
  createForPassenger(
    @Param('passengerId') passengerId: string,
    @Body() dto?: CreateEmailDto,
  ) {
    return this.emailsService.createForPassenger(passengerId, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Toplu e-posta oluştur' })
  bulkCreate(@Body() dto: BulkCreateEmailDto) {
    return this.emailsService.bulkCreate(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Tüm e-postaları listele' })
  findAll(@Query() query: EmailQueryDto) {
    return this.emailsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'E-posta istatistikleri' })
  getStats() {
    return this.emailsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'E-posta detayı' })
  findOne(@Param('id') id: string) {
    return this.emailsService.findOne(id);
  }

  @Get(':id/credentials')
  @ApiOperation({ summary: 'E-posta giriş bilgileri' })
  getCredentials(@Param('id') id: string) {
    return this.emailsService.getCredentials(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'E-postayı devre dışı bırak' })
  deactivate(@Param('id') id: string) {
    return this.emailsService.deactivate(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'E-postayı sil' })
  remove(@Param('id') id: string) {
    return this.emailsService.remove(id);
  }
}
