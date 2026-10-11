import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ModerationTargetType, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ModerationService } from './moderation.service';

@ApiTags('moderation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Lịch sử kiểm duyệt' })
  logs(
    @CurrentUser() user: { role: UserRole },
    @Query('targetType') targetType?: ModerationTargetType,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.moderationService.listLogs(user.role, {
      targetType,
      page,
      limit,
    });
  }
}
