import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ExpenseActionDto } from './dto/expense-action.dto';
import { VerifyCompanyDto } from './dto/verify-company.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/staff')
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tổng quan Staff' })
  staffDashboard(@CurrentUser() user: { role: UserRole }) {
    return this.adminService.staffOverview(user.role);
  }

  @Get('dashboard/super')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tổng quan Super Admin (doanh thu/chi phí)' })
  superDashboard(@CurrentUser() user: { role: UserRole }) {
    return this.adminService.superOverview(user.role);
  }

  @Get('companies/pending-verification')
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Công ty chờ xác minh' })
  pendingCompanies(@CurrentUser() user: { role: UserRole }) {
    return this.adminService.listCompaniesPendingVerification(user.role);
  }

  @Post('companies/:companyId/verify')
  @Roles(UserRole.STAFF, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Xác minh / từ chối hồ sơ công ty' })
  verifyCompany(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('companyId') companyId: string,
    @Body() dto: VerifyCompanyDto,
  ) {
    return this.adminService.verifyCompany(
      BigInt(user.userId),
      user.role,
      BigInt(companyId),
      dto,
    );
  }

  @Get('staff')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Danh sách nhân viên Staff' })
  listStaff(@CurrentUser() user: { role: UserRole }) {
    return this.adminService.listStaff(user.role);
  }

  @Post('staff')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tạo tài khoản Staff' })
  createStaff(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Body() dto: CreateStaffDto,
  ) {
    return this.adminService.createStaff(
      BigInt(user.userId),
      user.role,
      dto,
    );
  }

  @Post('staff/:userId/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  suspendStaff(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('userId') userId: string,
  ) {
    return this.adminService.setStaffActive(
      BigInt(user.userId),
      user.role,
      BigInt(userId),
      false,
    );
  }

  @Post('staff/:userId/activate')
  @Roles(UserRole.SUPER_ADMIN)
  activateStaff(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('userId') userId: string,
  ) {
    return this.adminService.setStaffActive(
      BigInt(user.userId),
      user.role,
      BigInt(userId),
      true,
    );
  }

  @Get('expenses')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Danh sách chi phí vận hành' })
  expenses(@CurrentUser() user: { role: UserRole }) {
    return this.adminService.listExpenses(user.role);
  }

  @Post('expenses')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tạo khoản chi phí' })
  createExpense(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Body() dto: CreateExpenseDto,
  ) {
    return this.adminService.createExpense(
      BigInt(user.userId),
      user.role,
      dto,
    );
  }

  @Post('expenses/:expenseId/submit')
  @Roles(UserRole.SUPER_ADMIN)
  submitExpense(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('expenseId') expenseId: string,
  ) {
    return this.adminService.submitExpense(
      BigInt(user.userId),
      user.role,
      BigInt(expenseId),
    );
  }

  @Post('expenses/:expenseId/approve')
  @Roles(UserRole.SUPER_ADMIN)
  approveExpense(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('expenseId') expenseId: string,
    @Body() dto: ExpenseActionDto,
  ) {
    return this.adminService.approveExpense(
      BigInt(user.userId),
      user.role,
      BigInt(expenseId),
      dto.note,
    );
  }

  @Post('expenses/:expenseId/reject')
  @Roles(UserRole.SUPER_ADMIN)
  rejectExpense(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('expenseId') expenseId: string,
    @Body() dto: ExpenseActionDto,
  ) {
    return this.adminService.rejectExpense(
      BigInt(user.userId),
      user.role,
      BigInt(expenseId),
      dto.note,
    );
  }

  @Post('expenses/:expenseId/mark-paid')
  @Roles(UserRole.SUPER_ADMIN)
  markPaidExpense(
    @CurrentUser() user: { userId: string; role: UserRole },
    @Param('expenseId') expenseId: string,
  ) {
    return this.adminService.markExpensePaid(
      BigInt(user.userId),
      user.role,
      BigInt(expenseId),
    );
  }

  @Get('audit-logs')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Nhật ký quản trị' })
  auditLogs(
    @CurrentUser() user: { role: UserRole },
    @Query('limit') limit?: number,
  ) {
    return this.adminService.listAuditLogs(user.role, limit);
  }
}
