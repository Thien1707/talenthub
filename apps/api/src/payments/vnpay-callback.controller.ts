import { Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';

/** Route VNPAY tách riêng — tránh xung đột với GET /payments/:paymentId */
@ApiTags('payments')
@Controller('payments/vnpay')
export class VnpayCallbackController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('return')
  @ApiOperation({ summary: 'VNPAY return URL — verify, credit wallet, redirect' })
  async vnpayReturnBrowser(
    @Query() query: Record<string, unknown>,
    @Res() res: Response,
  ) {
    const result = await this.paymentsService.handleVnpayReturn(query);
    const web = this.paymentsService.getWebReturnUrl();
    const params = new URLSearchParams();
    params.set(
      'vnp_ResponseCode',
      String(query['vnp_ResponseCode'] ?? (result.success ? '00' : '99')),
    );
    params.set(
      'vnp_TxnRef',
      String(query['vnp_TxnRef'] ?? result.vnpTxnRef ?? ''),
    );
    params.set('verified', result.success ? '1' : '0');
    params.set('walletCredited', result.walletCredited ? '1' : '0');
    return res.redirect(302, `${web}/thanh-toan/ket-qua?${params.toString()}`);
  }

  @Get('complete-return')
  @Post('complete-return')
  @ApiOperation({ summary: 'Xác minh VNPAY & cộng ví (frontend return URL)' })
  completeReturn(@Query() query: Record<string, unknown>) {
    return this.paymentsService.handleVnpayCompleteReturn(query);
  }

  @Get('ipn')
  @Post('ipn')
  @ApiOperation({ summary: 'VNPAY IPN' })
  vnpayIpn(@Query() query: Record<string, unknown>) {
    return this.paymentsService.handleVnpayIpn(query);
  }
}
