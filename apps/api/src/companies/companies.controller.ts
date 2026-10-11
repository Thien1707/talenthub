import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { CompaniesService } from './companies.service';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me/profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Hồ sơ công ty của tôi' })
  getMyProfile(@CurrentUser() user: { userId: string }) {
    return this.companiesService.getMyProfile(BigInt(user.userId));
  }

  @Patch('me/profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Cập nhật hồ sơ công ty' })
  updateMyProfile(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateCompanyProfileDto,
  ) {
    return this.companiesService.updateMyProfile(BigInt(user.userId), dto);
  }

  @Get(':companyId/public')
  @ApiOperation({ summary: 'Hồ sơ công ty công khai' })
  getPublic(@Param('companyId') companyId: string) {
    return this.companiesService.getPublicProfile(BigInt(companyId));
  }
}
