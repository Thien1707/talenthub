import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateVnpayDto } from './dto/create-vnpay.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('vnpay/create')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Tạo URL thanh toán VNPAY Sandbox' })
  createVnpay(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateVnpayDto,
    @Req() req: Request,
  ) {
    const ip =
      dto.ipAddr ??
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0]
        : req.ip);
    return this.paymentsService.createVnpayPayment(
      BigInt(user.userId),
      BigInt(dto.orderId),
      ip ?? '127.0.0.1',
    );
  }

  @Get('vnpay/return')
  @ApiOperation({ summary: 'VNPAY return URL (redirect browser)' })
  vnpayReturn(@Query() query: Record<string, string>) {
    return this.paymentsService.handleVnpayReturn(query);
  }

  @Post('vnpay/ipn')
  @ApiOperation({ summary: 'VNPAY IPN (server callback)' })
  vnpayIpn(@Query() query: Record<string, string>) {
    return this.paymentsService.handleVnpayIpn(query);
  }

  @Get(':paymentId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Chi tiết giao dịch thanh toán' })
  getPayment(
    @CurrentUser() user: { userId: string },
    @Param('paymentId') paymentId: string,
  ) {
    return this.paymentsService.getPayment(
      BigInt(user.userId),
      BigInt(paymentId),
    );
  }
}
