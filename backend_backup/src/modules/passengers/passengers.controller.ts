import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { PassengersService } from './passengers.service';
import {
  CreatePassengerDto,
  UpdatePassengerDto,
  PassengerQueryDto,
  BulkCreatePassengersDto,
} from './dto/passenger.dto';
import { ImportPassengersDto } from './dto/import.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Passengers')
@Controller('passengers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PassengersController {
  constructor(private passengersService: PassengersService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni yolcu ekle' })
  create(@Body() dto: CreatePassengerDto) {
    return this.passengersService.create(dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Toplu yolcu ekle' })
  bulkCreate(@Body() dto: BulkCreatePassengersDto) {
    return this.passengersService.bulkCreate(dto.passengers);
  }

  @Post('bulk-delete')
  @ApiOperation({ summary: 'Toplu yolcu sil' })
  bulkDelete(@Body() dto: { ids: string[] }) {
    return this.passengersService.bulkDelete(dto.ids);
  }

  @Get()
  @ApiOperation({ summary: 'Tüm yolcuları listele' })
  findAll(@Query() query: PassengerQueryDto) {
    return this.passengersService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Yolcu istatistikleri' })
  getStats() {
    return this.passengersService.getStats();
  }

  @Get('template')
  @ApiOperation({ summary: 'Excel sablon dosyasini indir' })
  downloadTemplate(@Res() res: Response) {
    const buffer = this.passengersService.generateTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=yolcu_sablonu.xlsx');
    res.send(buffer);
  }

  @Get('export')
  @ApiOperation({ summary: 'Yolculari Excel olarak disa aktar' })
  async exportToExcel(
    @Query('groupId') groupId: string,
    @Query('format') format: 'xlsx' | 'csv' = 'xlsx',
    @Res() res: Response,
  ) {
    const buffer = await this.passengersService.exportToExcel(groupId, format);
    const contentType = format === 'csv'
      ? 'text/csv'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const ext = format === 'csv' ? 'csv' : 'xlsx';
    const date = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=yolcular_${date}.${ext}`);
    res.send(buffer);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Yolcu detayı' })
  findOne(@Param('id') id: string) {
    return this.passengersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Yolcu güncelle' })
  update(@Param('id') id: string, @Body() dto: UpdatePassengerDto) {
    return this.passengersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Yolcu sil' })
  remove(@Param('id') id: string) {
    return this.passengersService.remove(id);
  }

  @Post('import')
  @ApiOperation({ summary: 'Excel/CSV dosyasindan yolcu aktar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel veya CSV dosyasi',
        },
        groupId: {
          type: 'string',
          description: 'Yolcularin eklenecegi grup ID (opsiyonel)',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
          'application/vnd.ms-excel', // xls
          'text/csv', // csv
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Sadece Excel (.xlsx, .xls) veya CSV dosyalari kabul edilir'), false);
        }
      },
    }),
  )
  async importFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportPassengersDto,
  ) {
    if (!file) {
      throw new BadRequestException('Dosya yuklenemedi');
    }
    return this.passengersService.importFromFile(file.buffer, file.mimetype, dto.groupId);
  }
}
