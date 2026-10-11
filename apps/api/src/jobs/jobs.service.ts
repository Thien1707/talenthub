import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EmploymentType,
  JobStatus,
  JobType,
  ModerationTargetType,
  Prisma,
} from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import {
  assertCompanyOwnsJob,
  getCompanyProfileForUser,
} from '../common/utils/company-access.util';
import { uniqueJobSlug } from '../common/utils/slug.util';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentRequiredException } from '../common/exceptions/payment-required.exception';
import { CreateJobDto } from './dto/create-job.dto';
import { PublicJobsQueryDto } from './dto/public-jobs-query.dto';
import { UpdateJobDto } from './dto/update-job.dto';

const DEFAULT_POST_DAYS = 30;

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) {}

  async createDraft(userId: bigint, dto: CreateJobDto) {
    const company = await getCompanyProfileForUser(this.prisma, userId);
    const slug = await uniqueJobSlug(dto.title, async (s) => {
      const found = await this.prisma.job.findUnique({ where: { slug: s } });
      return !!found;
    });
    return this.prisma.job.create({
      data: {
        companyId: company.companyId,
        categoryId: BigInt(dto.categoryId),
        title: dto.title,
        slug,
        description: dto.description,
        requirements: dto.requirements,
        benefits: dto.benefits,
        location: dto.location,
        salaryMin: dto.salaryMin,
        salaryMax: dto.salaryMax,
        salaryCurrency: dto.salaryCurrency ?? 'VND',
        employmentType: dto.employmentType ?? EmploymentType.FULL_TIME,
        experienceLevel: dto.experienceLevel,
        quantity: dto.quantity ?? 1,
        jobType: dto.jobType ?? JobType.NORMAL,
        status: JobStatus.DRAFT,
      },
      include: { category: true },
    });
  }

  async updateJob(userId: bigint, jobId: bigint, dto: UpdateJobDto) {
    const company = await getCompanyProfileForUser(this.prisma, userId);
    const job = await this.getJobOrThrow(jobId);
    assertCompanyOwnsJob(company.companyId, job.companyId);
    if (
      job.status !== JobStatus.DRAFT &&
      job.status !== JobStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Chỉ sửa được tin ở trạng thái nháp hoặc bị từ chối',
      );
    }
    let slug = job.slug;
    if (dto.title && dto.title !== job.title) {
      slug = await uniqueJobSlug(dto.title, async (s) => {
        const found = await this.prisma.job.findFirst({
          where: { slug: s, jobId: { not: jobId } },
        });
        return !!found;
      });
    }
    return this.prisma.job.update({
      where: { jobId },
      data: {
        ...dto,
        categoryId: dto.categoryId ? BigInt(dto.categoryId) : undefined,
        slug,
      },
      include: { category: true },
    });
  }

  async submitForModeration(userId: bigint, jobId: bigint) {
    const company = await getCompanyProfileForUser(this.prisma, userId);
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({ where: { jobId } });
      if (!job || job.deletedAt) {
        throw new NotFoundException('Không tìm thấy tin tuyển dụng');
      }
      assertCompanyOwnsJob(company.companyId, job.companyId);
      if (
        job.status !== JobStatus.DRAFT &&
        job.status !== JobStatus.REJECTED
      ) {
        throw new BadRequestException('Tin không thể gửi duyệt ở trạng thái hiện tại');
      }

      let isPaid = job.isPaid;
      let quotaConsumed = job.quotaConsumed;

      if (!job.quotaConsumed && !job.isPaid) {
        if (job.jobType === JobType.VIP) {
          throw new PaymentRequiredException({
            jobId: jobId.toString(),
            jobType: job.jobType,
            message: 'Tin VIP cần thanh toán trước khi gửi duyệt.',
          });
        }
        const quota = await tx.companyPostingQuota.findUnique({
          where: { companyId: company.companyId },
        });
        if (!quota) {
          throw new BadRequestException('Chưa cấu hình quota đăng tin');
        }
        if (quota.freePostUsed >= quota.freePostLimit) {
          throw new PaymentRequiredException({
            jobId: jobId.toString(),
            jobType: job.jobType,
          });
        }
        await tx.companyPostingQuota.update({
          where: { companyId: company.companyId },
          data: { freePostUsed: { increment: 1 } },
        });
        quotaConsumed = true;
        isPaid = true;
      }

      const updated = await tx.job.update({
        where: { jobId },
        data: {
          status: JobStatus.PENDING,
          isPaid,
          quotaConsumed,
          rejectionReason: null,
        },
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId,
          oldStatus: job.status,
          newStatus: JobStatus.PENDING,
          changedBy: userId,
          reason: 'Gửi kiểm duyệt',
        },
      });

      return updated;
    });
  }

  async listCompanyJobs(userId: bigint, query: PaginationQueryDto) {
    const company = await getCompanyProfileForUser(this.prisma, userId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where: { companyId: company.companyId, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: { category: true },
      }),
      this.prisma.job.count({
        where: { companyId: company.companyId, deletedAt: null },
      }),
    ]);
    return { items, total, page, limit };
  }

  async getCompanyJob(userId: bigint, jobId: bigint) {
    const company = await getCompanyProfileForUser(this.prisma, userId);
    const job = await this.prisma.job.findFirst({
      where: { jobId, companyId: company.companyId, deletedAt: null },
      include: { category: true, statusHistory: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!job) throw new NotFoundException('Không tìm thấy tin');
    return job;
  }

  async listPublic(query: PublicJobsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.JobWhereInput = {
      status: JobStatus.APPROVED,
      deletedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      AND: [
        {
          OR: [
            { jobType: JobType.NORMAL },
            { jobType: JobType.VIP, isPaid: true },
          ],
        },
      ],
    };

    if (query.keyword) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          OR: [
            { title: { contains: query.keyword } },
            { description: { contains: query.keyword } },
          ],
        },
      ];
    }
    if (query.categoryId) {
      where.categoryId = BigInt(query.categoryId);
    }
    if (query.city) {
      where.location = { contains: query.city };
    }
    if (query.salaryMin != null) {
      where.salaryMax = { gte: query.salaryMin };
    }

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ jobType: 'desc' }, { publishedAt: 'desc' }],
        include: {
          category: true,
          company: {
            select: {
              companyId: true,
              companyName: true,
              city: true,
              logoAssetId: true,
              verificationStatus: true,
            },
          },
        },
      }),
      this.prisma.job.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async getPublicBySlug(slug: string) {
    const now = new Date();
    const job = await this.prisma.job.findFirst({
      where: {
        slug,
        status: JobStatus.APPROVED,
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        category: true,
        company: {
          select: {
            companyId: true,
            companyName: true,
            description: true,
            website: true,
            city: true,
            logoAssetId: true,
            verificationStatus: true,
          },
        },
      },
    });
    if (!job) throw new NotFoundException('Tin tuyển dụng không tồn tại hoặc đã hết hạn');
    return job;
  }

  async pauseJob(userId: bigint, jobId: bigint) {
    return this.setCompanyJobStatus(userId, jobId, JobStatus.PAUSED, 'Tạm dừng tin');
  }

  async closeJob(userId: bigint, jobId: bigint) {
    return this.setCompanyJobStatus(userId, jobId, JobStatus.CLOSED, 'Đóng tin');
  }

  private async setCompanyJobStatus(
    userId: bigint,
    jobId: bigint,
    status: typeof JobStatus.PAUSED | typeof JobStatus.CLOSED,
    reason: string,
  ) {
    const company = await getCompanyProfileForUser(this.prisma, userId);
    const job = await this.getJobOrThrow(jobId);
    assertCompanyOwnsJob(company.companyId, job.companyId);
    if (job.status !== JobStatus.APPROVED) {
      throw new BadRequestException('Chỉ tạm dừng/đóng tin đang hiển thị');
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.job.update({
        where: { jobId },
        data: { status },
      });
      await tx.jobStatusHistory.create({
        data: {
          jobId,
          oldStatus: job.status,
          newStatus: status,
          changedBy: userId,
          reason,
        },
      });
      return updated;
    });
  }

  async listPending(query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = { status: JobStatus.PENDING, deletedAt: null };
    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'asc' },
        include: {
          category: true,
          company: { select: { companyId: true, companyName: true, city: true } },
        },
      }),
      this.prisma.job.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async approveJob(staffUserId: bigint, jobId: bigint) {
    return this.moderateJob(staffUserId, jobId, JobStatus.APPROVED);
  }

  async rejectJob(staffUserId: bigint, jobId: bigint, reason: string) {
    if (!reason?.trim()) {
      throw new BadRequestException('Cần lý do từ chối');
    }
    return this.moderateJob(staffUserId, jobId, JobStatus.REJECTED, reason);
  }

  private async moderateJob(
    staffUserId: bigint,
    jobId: bigint,
    newStatus: typeof JobStatus.APPROVED | typeof JobStatus.REJECTED,
    rejectionReason?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({ where: { jobId } });
      if (!job || job.deletedAt) {
        throw new NotFoundException('Không tìm thấy tin');
      }
      if (job.status !== JobStatus.PENDING) {
        throw new BadRequestException('Tin không ở trạng thái chờ duyệt');
      }

      const now = new Date();
      const expiresAt =
        newStatus === JobStatus.APPROVED
          ? new Date(now.getTime() + DEFAULT_POST_DAYS * 86400000)
          : job.expiresAt;

      const updated = await tx.job.update({
        where: { jobId },
        data: {
          status: newStatus,
          moderatedBy: staffUserId,
          moderatedAt: now,
          rejectionReason:
            newStatus === JobStatus.REJECTED ? rejectionReason : null,
          publishedAt: newStatus === JobStatus.APPROVED ? now : null,
          expiresAt: newStatus === JobStatus.APPROVED ? expiresAt : job.expiresAt,
        },
      });

      await tx.jobStatusHistory.create({
        data: {
          jobId,
          oldStatus: job.status,
          newStatus,
          changedBy: staffUserId,
          reason: rejectionReason ?? 'Duyệt tin',
        },
      });

      await tx.moderationLog.create({
        data: {
          actorId: staffUserId,
          targetType: ModerationTargetType.JOB,
          targetId: jobId,
          action: newStatus === JobStatus.APPROVED ? 'JOB_APPROVE' : 'JOB_REJECT',
          reason: rejectionReason,
          beforeData: { status: job.status },
          afterData: { status: newStatus },
        },
      });

      return updated;
    });
  }

  private async getJobOrThrow(jobId: bigint) {
    const job = await this.prisma.job.findFirst({
      where: { jobId, deletedAt: null },
    });
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    return job;
  }
}
