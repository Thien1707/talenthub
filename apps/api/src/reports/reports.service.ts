import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ModerationTargetType,
  ReportStatus,
  UserRole,
} from '@prisma/client';
import { assertStaffOrAdmin } from '../common/utils/staff-access.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(reporterUserId: bigint, dto: CreateReportDto) {
    if (!dto.reportedUserId && !dto.jobId && !dto.messageId) {
      throw new BadRequestException(
        'Cần ít nhất một đối tượng: người dùng, tin tuyển dụng hoặc tin nhắn',
      );
    }
    if (
      dto.reportedUserId &&
      BigInt(dto.reportedUserId) === reporterUserId
    ) {
      throw new BadRequestException('Không thể báo cáo chính mình');
    }

    return this.prisma.userReport.create({
      data: {
        reporterUserId,
        reportedUserId: dto.reportedUserId
          ? BigInt(dto.reportedUserId)
          : null,
        jobId: dto.jobId ? BigInt(dto.jobId) : null,
        messageId: dto.messageId ? BigInt(dto.messageId) : null,
        reportType: dto.reportType,
        reason: dto.reason,
        evidenceAssetId: dto.evidenceAssetId
          ? BigInt(dto.evidenceAssetId)
          : null,
        status: ReportStatus.PENDING,
      },
    });
  }

  listForStaff(
    role: UserRole,
    query: { status?: ReportStatus; page?: number; limit?: number },
  ) {
    assertStaffOrAdmin(role);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const where = query.status ? { status: query.status } : {};
    return this.prisma.userReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        reporter: { select: { userId: true, fullName: true, email: true } },
        reportedUser: {
          select: { userId: true, fullName: true, email: true },
        },
        job: { select: { jobId: true, title: true, slug: true } },
        assignedStaff: { select: { fullName: true } },
      },
    });
  }

  async assign(staffUserId: bigint, role: UserRole, reportId: bigint) {
    assertStaffOrAdmin(role);
    const report = await this.prisma.userReport.findUnique({
      where: { reportId },
    });
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo');
    if (
      report.status === ReportStatus.RESOLVED ||
      report.status === ReportStatus.REJECTED
    ) {
      throw new BadRequestException('Báo cáo đã được xử lý');
    }
    return this.prisma.userReport.update({
      where: { reportId },
      data: {
        status: ReportStatus.IN_REVIEW,
        assignedStaffId: staffUserId,
      },
    });
  }

  async resolve(
    staffUserId: bigint,
    role: UserRole,
    reportId: bigint,
    dto: ResolveReportDto,
  ) {
    assertStaffOrAdmin(role);
    const report = await this.prisma.userReport.findUnique({
      where: { reportId },
    });
    if (!report) throw new NotFoundException('Không tìm thấy báo cáo');

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.userReport.update({
        where: { reportId },
        data: {
          status: dto.status,
          resolutionNote: dto.resolutionNote ?? null,
          resolvedBy: staffUserId,
          resolvedAt: new Date(),
        },
      });
      await tx.moderationLog.create({
        data: {
          actorId: staffUserId,
          targetType: ModerationTargetType.REPORT,
          targetId: reportId,
          action:
            dto.status === ReportStatus.RESOLVED
              ? 'REPORT_RESOLVE'
              : 'REPORT_REJECT',
          reason: dto.resolutionNote,
          beforeData: { status: report.status },
          afterData: { status: dto.status },
        },
      });
      return row;
    });

    await this.notifications.create({
      userId: report.reporterUserId,
      notificationType: 'REPORT_UPDATE',
      title: 'Cập nhật báo cáo vi phạm',
      content:
        dto.resolutionNote ??
        (dto.status === ReportStatus.RESOLVED
          ? 'Báo cáo của bạn đã được xử lý.'
          : 'Báo cáo không được chấp nhận.'),
      referenceType: 'REPORT',
      referenceId: reportId,
    });

    return updated;
  }
}
