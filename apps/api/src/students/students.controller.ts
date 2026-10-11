import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
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
}
