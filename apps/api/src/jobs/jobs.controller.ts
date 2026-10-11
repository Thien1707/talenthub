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
import { UserRole } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateJobDto } from './dto/create-job.dto';
import { PublicJobsQueryDto } from './dto/public-jobs-query.dto';
import { RejectJobDto } from './dto/reject-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobsService } from './jobs.service';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách tin tuyển dụng công khai' })
  listPublic(@Query() query: PublicJobsQueryDto) {
    return this.jobsService.listPublic(query);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Chi tiết tin theo slug' })
  getBySlug(@Param('slug') slug: string) {
    return this.jobsService.getPublicBySlug(slug);
  }

  @Get('company/mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Tin tuyển dụng của công ty tôi' })
  listMine(
    @CurrentUser() user: { userId: string },
    @Query() query: PaginationQueryDto,
  ) {
    return this.jobsService.listCompanyJobs(BigInt(user.userId), query);
  }

  @Get('company/mine/:jobId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Chi tiết tin của công ty' })
  getMine(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
  ) {
    return this.jobsService.getCompanyJob(BigInt(user.userId), BigInt(jobId));
  }

  @Post('company')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Tạo tin nháp' })
  create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateJobDto,
  ) {
    return this.jobsService.createDraft(BigInt(user.userId), dto);
  }

  @Patch('company/:jobId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Cập nhật tin nháp / bị từ chối' })
  update(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.updateJob(
      BigInt(user.userId),
      BigInt(jobId),
      dto,
    );
  }

  @Post('company/:jobId/submit')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Gửi tin để kiểm duyệt (tiêu thụ quota nếu cần)' })
  submit(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
  ) {
    return this.jobsService.submitForModeration(
      BigInt(user.userId),
      BigInt(jobId),
    );
  }

  @Get('moderation/pending')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Staff — tin chờ duyệt' })
  listPending(@Query() query: PaginationQueryDto) {
    return this.jobsService.listPending(query);
  }

  @Post('company/:jobId/pause')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Tạm dừng tin đang hiển thị' })
  pause(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
  ) {
    return this.jobsService.pauseJob(BigInt(user.userId), BigInt(jobId));
  }

  @Post('company/:jobId/close')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Đóng tin tuyển dụng' })
  close(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
  ) {
    return this.jobsService.closeJob(BigInt(user.userId), BigInt(jobId));
  }

  @Post('moderation/:jobId/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Staff — duyệt tin' })
  approve(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
  ) {
    return this.jobsService.approveJob(BigInt(user.userId), BigInt(jobId));
  }

  @Post('moderation/:jobId/reject')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Staff — từ chối tin' })
  reject(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
    @Body() dto: RejectJobDto,
  ) {
    return this.jobsService.rejectJob(
      BigInt(user.userId),
      BigInt(jobId),
      dto.reason,
    );
  }
}
