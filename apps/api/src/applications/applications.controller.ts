import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CvsService } from '../cvs/cvs.service';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@ApiTags('applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly cvsService: CvsService,
  ) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Ứng tuyển tin tuyển dụng' })
  apply(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.apply(BigInt(user.userId), dto);
  }

  @Get('me')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Hồ sơ ứng tuyển của tôi' })
  listMine(@CurrentUser() user: { userId: string }) {
    return this.applicationsService.listMine(BigInt(user.userId));
  }

  @Post('me/:applicationId/withdraw')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Rút hồ sơ ứng tuyển' })
  withdraw(
    @CurrentUser() user: { userId: string },
    @Param('applicationId') applicationId: string,
  ) {
    return this.applicationsService.withdraw(
      BigInt(user.userId),
      BigInt(applicationId),
    );
  }

  @Get('job/:jobId')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Ứng viên theo tin (công ty)' })
  listForJob(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
  ) {
    return this.applicationsService.listForJob(
      BigInt(user.userId),
      BigInt(jobId),
    );
  }

  @Get(':applicationId/cv/export/pdf')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Tải PDF CV builder của ứng viên' })
  async exportApplicantCvPdf(
    @CurrentUser() user: { userId: string },
    @Param('applicationId') applicationId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.cvsService.exportPdfForApplication(
      BigInt(user.userId),
      BigInt(applicationId),
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ung-vien-${applicationId}.pdf"`,
    );
    res.end(buffer);
  }

  @Get(':applicationId/cv')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Xem CV ứng viên (builder hoặc PDF upload)' })
  getApplicantCv(
    @CurrentUser() user: { userId: string },
    @Param('applicationId') applicationId: string,
  ) {
    return this.applicationsService.getApplicantCv(
      BigInt(user.userId),
      BigInt(applicationId),
    );
  }

  @Patch(':applicationId/status')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Cập nhật trạng thái ứng viên' })
  updateStatus(
    @CurrentUser() user: { userId: string },
    @Param('applicationId') applicationId: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(
      BigInt(user.userId),
      BigInt(applicationId),
      dto,
    );
  }
}
