import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PricingService } from './pricing.service';

@ApiTags('pricing')
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('plans')
  @ApiOperation({ summary: 'Bảng giá đăng tin đang áp dụng' })
  listPlans() {
    return this.pricingService.listActivePlans();
  }
}
