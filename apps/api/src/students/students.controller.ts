import { Body, Controller, Get, Patch, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { StudentsService } from './students.service';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('me/profile')
  @ApiOperation({ summary: 'Xem hồ sơ sinh viên của tôi' })
  getProfile(@CurrentUser() user: { userId: string }) {
    return this.studentsService.getMyProfile(BigInt(user.userId));
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Cập nhật hồ sơ sinh viên' })
  updateProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateStudentProfileDto,
  ) {
    return this.studentsService.updateMyProfile(BigInt(user.userId), dto);
  }

  @Put('me/availability')
  @ApiOperation({ summary: 'Cập nhật lịch có thể làm việc' })
  updateAvailability(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateAvailabilityDto,
  ) {
    return this.studentsService.upsertAvailability(BigInt(user.userId), dto);
  }

  @Get('me/matching-jobs')
  @ApiOperation({ summary: 'Danh sách công việc phù hợp nhất với sinh viên' })
  matchingJobs(@CurrentUser() user: { userId: string }) {
    return this.studentsService.getMatchingJobs(BigInt(user.userId));
  }
}
