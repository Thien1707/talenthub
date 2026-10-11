import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Thông báo của tôi' })
  listMine(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.listForUser(BigInt(user.userId));
  }

  @Get('me/unread-count')
  @ApiOperation({ summary: 'Số thông báo chưa đọc' })
  unread(@CurrentUser() user: { userId: string }) {
    return this.notificationsService
      .unreadCount(BigInt(user.userId))
      .then((count) => ({ count }));
  }

  @Patch(':notificationId/read')
  @ApiOperation({ summary: 'Đánh dấu đã đọc' })
  markRead(
    @CurrentUser() user: { userId: string },
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationsService.markRead(
      BigInt(user.userId),
      BigInt(notificationId),
    );
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Đọc tất cả' })
  readAll(@CurrentUser() user: { userId: string }) {
    return this.notificationsService.markAllRead(BigInt(user.userId));
  }
}
