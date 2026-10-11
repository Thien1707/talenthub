import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavedJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(studentUserId: bigint) {
    return this.prisma.savedJob.findMany({
      where: { studentUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          include: {
            company: { select: { companyName: true, companyId: true } },
          },
        },
      },
    });
  }

  async save(studentUserId: bigint, jobId: bigint) {
    await this.ensureStudent(studentUserId);
    const job = await this.prisma.job.findFirst({
      where: { jobId, status: JobStatus.APPROVED, deletedAt: null },
    });
    if (!job) {
      throw new NotFoundException('Tin tuyển dụng không khả dụng');
    }
    return this.prisma.savedJob.upsert({
      where: {
        studentUserId_jobId: { studentUserId, jobId },
      },
      create: { studentUserId, jobId },
      update: {},
    });
  }

  async remove(studentUserId: bigint, jobId: bigint) {
    await this.prisma.savedJob.deleteMany({
      where: { studentUserId, jobId },
    });
    return { success: true };
  }

  private async ensureStudent(userId: bigint) {
    const user = await this.prisma.user.findFirst({
      where: { userId, role: UserRole.STUDENT },
    });
    if (!user) throw new ForbiddenException('Chỉ sinh viên mới lưu được tin');
  }
}
