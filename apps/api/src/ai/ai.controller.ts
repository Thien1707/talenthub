import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AiService } from './ai.service';
import { AnalyzeGeneralDto } from './dto/analyze-general.dto';
import { AnalyzeJobMatchDto } from './dto/analyze-job-match.dto';
import { CvBuildChatDto } from './dto/cv-build-chat.dto';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('cv/build-chat')
  @Roles(UserRole.STUDENT)
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Trò chuyện với Gemini để soạn / cập nhật CV (JSON)',
  })
  cvBuildChat(
    @CurrentUser() user: { userId: string },
    @Body() dto: CvBuildChatDto,
  ) {
    return this.aiService.cvBuildChat(BigInt(user.userId), dto);
  }

  @Post('analyses/general')
  @Roles(UserRole.STUDENT)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Phân tích CV tổng quát (Gemini)' })
  analyzeGeneral(
    @CurrentUser() user: { userId: string },
    @Body() dto: AnalyzeGeneralDto,
  ) {
    return this.aiService.analyzeGeneral(BigInt(user.userId), dto);
  }

  @Post('analyses/job-match')
  @Roles(UserRole.STUDENT, UserRole.COMPANY)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary:
      'Đối chiếu CV với tin (sinh viên) hoặc ứng viên đã nộp (công ty)',
  })
  analyzeJobMatch(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Body() dto: AnalyzeJobMatchDto,
  ) {
    return this.aiService.analyzeJobMatch(
      BigInt(user.userId),
      user.role,
      dto,
    );
  }

  @Get('analyses/me')
  @Roles(UserRole.STUDENT, UserRole.COMPANY)
  @ApiOperation({ summary: 'Lịch sử phân tích AI của tôi' })
  listMine(@CurrentUser() user: { userId: string; role: UserRole }) {
    return this.aiService.listMine(BigInt(user.userId), user.role);
  }

  @Get('analyses/:analysisId')
  @Roles(
    UserRole.STUDENT,
    UserRole.COMPANY,
    UserRole.STAFF,
    UserRole.SUPER_ADMIN,
  )
  @ApiOperation({ summary: 'Chi tiết phân tích (kiểm tra quyền)' })
  getOne(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('analysisId') analysisId: string,
  ) {
    return this.aiService.getById(
      BigInt(user.userId),
      user.role,
      BigInt(analysisId),
    );
  }

  @Get('applications/:applicationId/analysis')
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Phân tích JOB_MATCH mới nhất của ứng viên' })
  forApplication(
    @CurrentUser() user: { userId: string },
    @Param('applicationId') applicationId: string,
  ) {
    return this.aiService.getForApplication(
      BigInt(user.userId),
      BigInt(applicationId),
    );
  }
}
