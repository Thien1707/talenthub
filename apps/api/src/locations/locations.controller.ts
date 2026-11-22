import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LocationsService } from './locations.service';

@ApiTags('locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('provinces')
  @ApiOperation({ summary: 'Danh sách tỉnh/thành phố' })
  listProvinces() {
    return this.locationsService.getProvinces();
  }

  @Get('provinces/:provinceCode/wards')
  @ApiOperation({ summary: 'Danh sách phường/xã theo tỉnh/thành phố' })
  listWards(@Param('provinceCode') provinceCode: string) {
    return this.locationsService.getWardsByProvince(provinceCode);
  }
}
