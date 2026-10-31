import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateWalletTopUpDto } from './dto/create-wallet-top-up.dto';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.COMPANY)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('me')
  @ApiOperation({ summary: 'Số dư ví NTD' })
  getWallet(@CurrentUser() user: { userId: string }) {
    return this.walletService.getWalletForUser(BigInt(user.userId));
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Lịch sử giao dịch ví' })
  listTransactions(
    @CurrentUser() user: { userId: string },
    @Query('limit') limit?: string,
  ) {
    const n = limit ? Math.min(Number(limit), 100) : 30;
    return this.walletService.listTransactions(BigInt(user.userId), n);
  }

  @Post('top-up')
  @ApiOperation({ summary: 'Tạo đơn nạp ví (thanh toán VNPAY)' })
  async createTopUp(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateWalletTopUpDto,
  ) {
    const order = await this.walletService.createTopUpOrder(
      BigInt(user.userId),
      dto.amountVnd,
    );
    return { orderId: order.orderId.toString(), orderCode: order.orderCode };
  }
}
