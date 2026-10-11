import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SavedJobsService } from './saved-jobs.service';

@ApiTags('saved-jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@Controller('saved-jobs')
export class SavedJobsController {
  constructor(private readonly savedJobsService: SavedJobsService) {}

  @Get()
  @ApiOperation({ summary: 'Việc làm đã lưu' })
  list(@CurrentUser() user: { userId: string }) {
    return this.savedJobsService.list(BigInt(user.userId));
  }

  @Post(':jobId')
  @ApiOperation({ summary: 'Lưu tin tuyển dụng' })
  save(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
  ) {
    return this.savedJobsService.save(BigInt(user.userId), BigInt(jobId));
  }

  @Delete(':jobId')
  @ApiOperation({ summary: 'Bỏ lưu' })
  remove(
    @CurrentUser() user: { userId: string },
    @Param('jobId') jobId: string,
  ) {
    return this.savedJobsService.remove(BigInt(user.userId), BigInt(jobId));
  }
}
