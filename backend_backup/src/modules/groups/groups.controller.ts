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
import { GroupsService } from './groups.service';
import {
  CreateGroupDto,
  UpdateGroupDto,
  GroupQueryDto,
  AddPassengersDto,
} from './dto/group.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({ summary: 'Yeni grup olustur' })
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Tum gruplari listele' })
  findAll(@Query() query: GroupQueryDto) {
    return this.groupsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Grup istatistiklerini getir' })
  getStats() {
    return this.groupsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Grup detaylarini getir' })
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Grup bilgilerini guncelle' })
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Grubu sil' })
  remove(@Param('id') id: string) {
    return this.groupsService.remove(id);
  }

  @Post(':id/passengers')
  @ApiOperation({ summary: 'Gruba yolcu ekle' })
  addPassengers(@Param('id') id: string, @Body() dto: AddPassengersDto) {
    return this.groupsService.addPassengers(id, dto.passengerIds);
  }

  @Delete(':id/passengers')
  @ApiOperation({ summary: 'Gruptan yolcu cikar' })
  removePassengers(@Param('id') id: string, @Body() dto: AddPassengersDto) {
    return this.groupsService.removePassengers(id, dto.passengerIds);
  }
}
