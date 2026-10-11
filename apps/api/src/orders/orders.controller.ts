import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreatePostOrderDto } from './dto/create-post-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.COMPANY)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('post-job')
  @ApiOperation({ summary: 'Tạo đơn thanh toán đăng tin (hết quota / VIP)' })
  createPostOrder(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreatePostOrderDto,
  ) {
    return this.ordersService.createPostOrder(
      BigInt(user.userId),
      BigInt(dto.jobId),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Danh sách đơn hàng của công ty' })
  list(@CurrentUser() user: { userId: string }) {
    return this.ordersService.listCompanyOrders(BigInt(user.userId));
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Chi tiết đơn hàng' })
  getOne(
    @CurrentUser() user: { userId: string },
    @Param('orderId') orderId: string,
  ) {
    return this.ordersService.getCompanyOrder(
      BigInt(user.userId),
      BigInt(orderId),
    );
  }
}
