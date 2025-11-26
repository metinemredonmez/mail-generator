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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PassengersService } from './passengers.service';
import {
  CreatePassengerDto,
  UpdatePassengerDto,
  PassengerQueryDto,
  BulkCreatePassengersDto,
} from './dto/passenger.dto';
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
}
