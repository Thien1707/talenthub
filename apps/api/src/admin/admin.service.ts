import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ExpenseStatus,
  JobStatus,
  ModerationTargetType,
  OrderStatus,
  ReportStatus,
  UserRole,
  UserStatus,
  VerificationStatus,
} from '@prisma/client';
import {
  assertStaffOrAdmin,
  assertSuperAdmin,
} from '../common/utils/staff-access.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { VerifyCompanyDto } from './dto/verify-company.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async staffOverview(role: UserRole) {
    assertStaffOrAdmin(role);
    const [
      pendingJobs,
      pendingReports,
      inReviewReports,
      pendingCompanies,
      totalUsers,
      totalApplications,
    ] = await Promise.all([
      this.prisma.job.count({
        where: { status: JobStatus.PENDING, deletedAt: null },
      }),
      this.prisma.userReport.count({ where: { status: ReportStatus.PENDING } }),
      this.prisma.userReport.count({
        where: { status: ReportStatus.IN_REVIEW },
      }),
      this.prisma.companyProfile.count({
        where: { verificationStatus: VerificationStatus.PENDING },
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.application.count(),
    ]);
    return {
      pendingJobs,
      pendingReports,
      inReviewReports,
      pendingCompanies,
      totalUsers,
      totalApplications,
    };
  }

  async superOverview(role: UserRole) {
    assertSuperAdmin(role);
    const staff = await this.staffOverview(role);
    const [paidOrders, revenueAgg, expenseAgg, expensesPending] =
      await Promise.all([
        this.prisma.order.count({ where: { status: OrderStatus.PAID } }),
        this.prisma.order.aggregate({
          where: { status: OrderStatus.PAID },
          _sum: { totalAmount: true },
        }),
        this.prisma.expense.aggregate({
          where: {
            status: { in: [ExpenseStatus.APPROVED, ExpenseStatus.PAID] },
          },
          _sum: { amount: true },
        }),
        this.prisma.expense.count({
          where: { status: ExpenseStatus.PENDING },
        }),
      ]);
    return {
      ...staff,
      paidOrders,
      revenueTotal: revenueAgg._sum.totalAmount?.toString() ?? '0',
      expensesTotal: expenseAgg._sum.amount?.toString() ?? '0',
      expensesPending,
    };
  }

  listCompaniesPendingVerification(role: UserRole) {
    assertStaffOrAdmin(role);
    return this.prisma.companyProfile.findMany({
      where: { verificationStatus: VerificationStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: 50,
      include: {
        user: { select: { email: true, fullName: true, phone: true } },
      },
    });
  }

  async verifyCompany(
    actorId: bigint,
    role: UserRole,
    companyId: bigint,
    dto: VerifyCompanyDto,
  ) {
    assertStaffOrAdmin(role);
    const company = await this.prisma.companyProfile.findUnique({
      where: { companyId },
    });
    if (!company) throw new NotFoundException('Không tìm thấy công ty');

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.companyProfile.update({
        where: { companyId },
        data: {
          verificationStatus: dto.status,
          verifiedBy: actorId,
          verifiedAt: new Date(),
        },
      });
      await tx.moderationLog.create({
        data: {
          actorId,
          targetType: ModerationTargetType.COMPANY,
          targetId: companyId,
          action:
            dto.status === VerificationStatus.VERIFIED
              ? 'COMPANY_VERIFY'
              : 'COMPANY_VERIFY_REJECT',
          reason: dto.note,
          beforeData: {
            verificationStatus: company.verificationStatus,
          },
          afterData: { verificationStatus: dto.status },
        },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'COMPANY_VERIFICATION',
          entityType: 'COMPANY',
          entityId: companyId,
          afterData: { status: dto.status, note: dto.note },
        },
      });
      return { updated, companyUserId: company.userId };
    }).then(async ({ updated, companyUserId }) => {
      await this.notifications.create({
        userId: companyUserId,
        notificationType: 'COMPANY_VERIFICATION',
        title: 'Xác minh công ty',
        content:
          dto.status === VerificationStatus.VERIFIED
            ? 'Hồ sơ công ty đã được xác minh.'
            : `Xác minh bị từ chối.${dto.note ? ` ${dto.note}` : ''}`,
        referenceType: 'COMPANY',
        referenceId: companyId,
      });
      return updated;
    });
  }

  listExpenses(role: UserRole) {
    assertSuperAdmin(role);
    return this.prisma.expense.findMany({
      orderBy: { expenseDate: 'desc' },
      take: 100,
    });
  }

  createExpense(actorId: bigint, role: UserRole, dto: CreateExpenseDto) {
    assertSuperAdmin(role);
    return this.prisma.expense.create({
      data: {
        expenseCode: dto.expenseCode,
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        expenseDate: new Date(dto.expenseDate),
        vendorName: dto.vendorName,
        createdBy: actorId,
        status: ExpenseStatus.DRAFT,
      },
    });
  }

  listStaff(role: UserRole) {
    assertSuperAdmin(role);
    return this.prisma.user.findMany({
      where: { role: UserRole.STAFF, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { staffProfile: true },
    });
  }

  async createStaff(actorId: bigint, role: UserRole, dto: CreateStaffDto) {
    assertSuperAdmin(role);
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (exists) throw new ConflictException('Email đã tồn tại');
    const codeUsed = await this.prisma.staffProfile.findUnique({
      where: { employeeCode: dto.employeeCode },
    });
    if (codeUsed) throw new ConflictException('Mã nhân viên đã tồn tại');

    const passwordHash = await argon2.hash(dto.password);
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          fullName: dto.fullName,
          role: UserRole.STAFF,
          status: UserStatus.ACTIVE,
          emailVerifiedAt: new Date(),
        },
      });
      await tx.staffProfile.create({
        data: {
          userId: user.userId,
          employeeCode: dto.employeeCode,
          department: dto.department,
          position: dto.position,
          hiredAt: new Date(),
        },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'STAFF_CREATE',
          entityType: 'USER',
          entityId: user.userId,
          afterData: { email: user.email, employeeCode: dto.employeeCode },
        },
      });
      return user;
    });
  }

  async setStaffActive(
    actorId: bigint,
    role: UserRole,
    userId: bigint,
    active: boolean,
  ) {
    assertSuperAdmin(role);
    const user = await this.prisma.user.findFirst({
      where: { userId, role: UserRole.STAFF },
    });
    if (!user) throw new NotFoundException('Không tìm thấy staff');
    return this.prisma.user.update({
      where: { userId },
      data: {
        status: active ? UserStatus.ACTIVE : UserStatus.SUSPENDED,
      },
    });
  }

  async submitExpense(actorId: bigint, role: UserRole, expenseId: bigint) {
    assertSuperAdmin(role);
    const exp = await this.getOwnedExpense(expenseId, actorId);
    if (exp.status !== ExpenseStatus.DRAFT) {
      throw new BadRequestException('Chỉ gửi duyệt từ trạng thái DRAFT');
    }
    return this.prisma.expense.update({
      where: { expenseId },
      data: { status: ExpenseStatus.PENDING },
    });
  }

  async approveExpense(
    actorId: bigint,
    role: UserRole,
    expenseId: bigint,
    note?: string,
  ) {
    assertSuperAdmin(role);
    const exp = await this.prisma.expense.findUnique({
      where: { expenseId },
    });
    if (!exp || exp.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('Chi phí không ở trạng thái chờ duyệt');
    }
    return this.prisma.expense.update({
      where: { expenseId },
      data: {
        status: ExpenseStatus.APPROVED,
        approvedBy: actorId,
        approvedAt: new Date(),
        description: note ? `${exp.description}\n[Note: ${note}]` : exp.description,
      },
    });
  }

  async rejectExpense(
    actorId: bigint,
    role: UserRole,
    expenseId: bigint,
    note?: string,
  ) {
    assertSuperAdmin(role);
    const exp = await this.prisma.expense.findUnique({
      where: { expenseId },
    });
    if (!exp || exp.status !== ExpenseStatus.PENDING) {
      throw new BadRequestException('Chi phí không ở trạng thái chờ duyệt');
    }
    return this.prisma.expense.update({
      where: { expenseId },
      data: { status: ExpenseStatus.REJECTED },
    });
  }

  async markExpensePaid(actorId: bigint, role: UserRole, expenseId: bigint) {
    assertSuperAdmin(role);
    const exp = await this.prisma.expense.findUnique({
      where: { expenseId },
    });
    if (!exp || exp.status !== ExpenseStatus.APPROVED) {
      throw new BadRequestException('Chi phí phải được duyệt trước');
    }
    return this.prisma.expense.update({
      where: { expenseId },
      data: { status: ExpenseStatus.PAID },
    });
  }

  private async getOwnedExpense(expenseId: bigint, createdBy: bigint) {
    const exp = await this.prisma.expense.findUnique({ where: { expenseId } });
    if (!exp || exp.createdBy !== createdBy) {
      throw new NotFoundException('Không tìm thấy chi phí');
    }
    return exp;
  }

  listAuditLogs(role: UserRole, limit = 50) {
    assertSuperAdmin(role);
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      include: {
        actor: { select: { fullName: true, email: true, role: true } },
      },
    });
  }
}
