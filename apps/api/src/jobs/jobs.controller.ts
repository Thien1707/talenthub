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
import { PromotionFeatureCode, UserRole } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateJobDto } from './dto/create-job.dto';
import { PublicJobsQueryDto } from './dto/public-jobs-query.dto';
import { RejectJobDto } from './dto/reject-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { PublishJobDto } from './dto/publish-job.dto';
import { JobPublishService } from './job-publish.service';
import { JobsService } from './jobs.service';
@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly jobPublishService: JobPublishService,
  ) {}

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
  async create(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateJobDto,
  ) {
    const job = await this.jobsService.createDraft(BigInt(user.userId), dto);
    return {
      jobId: job.jobId.toString(),
      title: job.title,
      status: job.status,
      slug: job.slug,
    };
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

  @Get('company/:jobId/publish-quote')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Báo giá đăng tin + quảng bá (server-side)' })
  publishQuote(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
    @Query('promotions') promotions?: string,
  ) {
    const codes = (promotions ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean) as PromotionFeatureCode[];
    return this.jobPublishService.getPublishQuote(
      BigInt(user.userId),
      BigInt(jobId),
      codes,
    );
  }

  @Post('company/:jobId/publish')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Thanh toán ví và gửi tin kiểm duyệt' })
  publish(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
    @Body() dto: PublishJobDto,
  ) {
    return this.jobPublishService.publishJob(
      BigInt(user.userId),
      BigInt(jobId),
      dto.promotionCodes ?? [],
      dto.idempotencyKey,
    );
  }

  @Post('company/:jobId/submit')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Gửi tin để kiểm duyệt (legacy — ưu tiên /publish)' })
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

  @Post('company/:jobId/resume')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Tiếp tục tin đang tạm dừng' })
  resume(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
  ) {
    return this.jobsService.resumeJob(BigInt(user.userId), BigInt(jobId));
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
