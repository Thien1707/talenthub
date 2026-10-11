import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReportStatus, UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @Roles(UserRole.STUDENT, UserRole.COMPANY)
  @ApiOperation({ summary: 'Gửi báo cáo vi phạm' })
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.create(BigInt(user.userId), dto);
  }

  @Get('staff/queue')
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Staff — hàng đợi báo cáo' })
  queue(
    @CurrentUser() user: { role: UserRole },
    @Query('status') status?: ReportStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.listForStaff(user.role, {
      status,
      page,
      limit,
    });
  }

  @Patch('staff/:reportId/assign')
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Staff — nhận xử lý báo cáo' })
  assign(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('reportId') reportId: string,
  ) {
    return this.reportsService.assign(
      BigInt(user.userId),
      user.role,
      BigInt(reportId),
    );
  }

  @Patch('staff/:reportId/resolve')
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Staff — kết luận báo cáo' })
  resolve(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('reportId') reportId: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.reportsService.resolve(
      BigInt(user.userId),
      user.role,
      BigInt(reportId),
      dto,
    );
  }
}
