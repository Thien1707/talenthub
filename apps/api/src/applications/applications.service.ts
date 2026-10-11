import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  JobStatus,
  UserRole,
} from '@prisma/client';
import { getCompanyProfileForUser } from '../common/utils/company-access.util';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async apply(studentUserId: bigint, dto: CreateApplicationDto) {
    const job = await this.prisma.job.findFirst({
      where: {
        jobId: BigInt(dto.jobId),
        status: JobStatus.APPROVED,
        deletedAt: null,
      },
    });
    if (!job) {
      throw new BadRequestException('Tin tuyển dụng không khả dụng');
    }

    const cvVersion = await this.prisma.cvVersion.findUnique({
      where: { cvVersionId: BigInt(dto.cvVersionId) },
      include: { cv: true },
    });
    if (!cvVersion || cvVersion.cv.studentUserId !== studentUserId) {
      throw new ForbiddenException('CV không thuộc về bạn');
    }

    try {
      const created = await this.prisma.application.create({
        data: {
          jobId: job.jobId,
          studentUserId,
          cvVersionId: cvVersion.cvVersionId,
          coverLetter: dto.coverLetter,
          status: ApplicationStatus.SUBMITTED,
        },
        include: {
          job: {
            select: {
              title: true,
              slug: true,
              companyId: true,
              company: { select: { userId: true } },
            },
          },
        },
      });
      await this.notifications.create({
        userId: created.job.company.userId,
        notificationType: 'NEW_APPLICATION',
        title: 'Hồ sơ ứng tuyển mới',
        content: `Có ứng viên mới cho tin "${created.job.title}"`,
        referenceType: 'APPLICATION',
        referenceId: created.applicationId,
      });
      return created;
    } catch {
      throw new BadRequestException('Bạn đã ứng tuyển tin này');
    }
  }

  async listMine(studentUserId: bigint) {
    return this.prisma.application.findMany({
      where: { studentUserId },
      orderBy: { appliedAt: 'desc' },
      include: {
        job: {
          include: {
            company: { select: { companyName: true, companyId: true } },
          },
        },
        cvVersion: true,
      },
    });
  }

  async withdraw(studentUserId: bigint, applicationId: bigint) {
    const app = await this.prisma.application.findFirst({
      where: { applicationId, studentUserId },
    });
    if (!app) throw new NotFoundException('Không tìm thấy hồ sơ');
    if (
      app.status !== ApplicationStatus.SUBMITTED &&
      app.status !== ApplicationStatus.REVIEWING
    ) {
      throw new BadRequestException('Không thể rút hồ sơ ở trạng thái này');
    }
    return this.prisma.application.update({
      where: { applicationId },
      data: { status: ApplicationStatus.WITHDRAWN },
    });
  }

  async listForJob(companyUserId: bigint, jobId: bigint) {
    const company = await getCompanyProfileForUser(this.prisma, companyUserId);
    const job = await this.prisma.job.findFirst({
      where: { jobId, companyId: company.companyId },
    });
    if (!job) throw new NotFoundException('Không tìm thấy tin');

    return this.prisma.application.findMany({
      where: { jobId },
      orderBy: { appliedAt: 'desc' },
      include: {
        student: {
          select: { userId: true, fullName: true, email: true, phone: true },
        },
        cvVersion: {
          include: {
            cv: { select: { cvName: true } },
            fileAsset: {
              select: {
                assetId: true,
                originalFilename: true,
                mimeType: true,
              },
            },
          },
        },
      },
    });
  }

  async getApplicantCv(companyUserId: bigint, applicationId: bigint) {
    const company = await getCompanyProfileForUser(this.prisma, companyUserId);
    const app = await this.prisma.application.findFirst({
      where: {
        applicationId,
        job: { companyId: company.companyId },
      },
      include: {
        student: {
          select: {
            userId: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        job: { select: { jobId: true, title: true } },
        cvVersion: {
          include: {
            cv: {
              select: {
                cvName: true,
                cvId: true,
                template: { select: { templateConfig: true, templateName: true } },
              },
            },
            fileAsset: {
              select: {
                assetId: true,
                originalFilename: true,
                mimeType: true,
              },
            },
          },
        },
      },
    });
    if (!app) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng tuyển');
    }
    const v = app.cvVersion;
    return {
      applicationId: app.applicationId.toString(),
      coverLetter: app.coverLetter,
      student: app.student,
      job: app.job,
      cvVersionId: v.cvVersionId.toString(),
      cvId: v.cv.cvId.toString(),
      cvName: v.cv.cvName,
      templateName: v.cv.template?.templateName ?? null,
      templateConfig: v.cv.template?.templateConfig ?? null,
      sourceType: v.sourceType,
      contentJson: v.contentJson,
      plainTextContent: v.plainTextContent,
      fileAsset: v.fileAsset
        ? {
            assetId: v.fileAsset.assetId.toString(),
            originalFilename: v.fileAsset.originalFilename,
            mimeType: v.fileAsset.mimeType,
          }
        : null,
    };
  }

  async updateStatus(
    companyUserId: bigint,
    applicationId: bigint,
    dto: UpdateApplicationStatusDto,
  ) {
    const company = await getCompanyProfileForUser(this.prisma, companyUserId);
    const app = await this.prisma.application.findUnique({
      where: { applicationId },
      include: { job: true },
    });
    if (!app || app.job.companyId !== company.companyId) {
      throw new ForbiddenException('Không có quyền');
    }
    const updated = await this.prisma.application.update({
      where: { applicationId },
      data: { status: dto.status },
      include: { job: { select: { title: true } } },
    });
    await this.notifications.create({
      userId: app.studentUserId,
      notificationType: 'APPLICATION_STATUS',
      title: 'Cập nhật hồ sơ ứng tuyển',
      content: `Tin "${updated.job.title}": trạng thái ${dto.status}`,
      referenceType: 'APPLICATION',
      referenceId: applicationId,
    });
    return updated;
  }
}
