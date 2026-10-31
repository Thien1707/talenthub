import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AnalysisStatus,
  AnalysisType,
  JobStatus,
  UserRole,
} from '@prisma/client';
import { getCompanyProfileForUser } from '../common/utils/company-access.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  AI_ANALYSIS_REQUESTED,
  type AiAnalysisRequestedPayload,
} from './ai-analysis.events';
import { CvContent, emptyCvContent } from '../cvs/cv-content.schema';
import { AnalyzeGeneralDto } from './dto/analyze-general.dto';
import { AnalyzeJobMatchDto } from './dto/analyze-job-match.dto';
import { CvBuildChatDto } from './dto/cv-build-chat.dto';
import { GeminiService } from './gemini.service';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly gemini: GeminiService,
  ) {}

  async cvBuildChat(studentUserId: bigint, dto: CvBuildChatDto) {
    if (dto.cvVersionId) {
      const cvVersion = await this.prisma.cvVersion.findUnique({
        where: { cvVersionId: BigInt(dto.cvVersionId) },
        include: { cv: true },
      });
      if (!cvVersion) {
        throw new NotFoundException('Không tìm thấy phiên bản CV');
      }
      if (cvVersion.cv.studentUserId !== studentUserId) {
        throw new ForbiddenException('CV không thuộc về bạn');
      }
    }

    const currentContent = {
      ...emptyCvContent(),
      ...(dto.currentContent as CvContent),
    };

    const { modelName, result } = await this.gemini.cvBuildChat({
      messages: dto.messages,
      currentContent,
      jobTitle: dto.jobTitle,
    });

    return {
      modelName,
      message: result.message,
      content: result.content ?? currentContent,
    };
  }

  analyzeGeneral(studentUserId: bigint, dto: AnalyzeGeneralDto) {
    return this.runAnalysis({
      requesterId: studentUserId,
      requesterRole: UserRole.STUDENT,
      cvVersionId: BigInt(dto.cvVersionId),
      jobId: null,
      analysisType: AnalysisType.GENERAL,
      forceRefresh: dto.forceRefresh === true,
    });
  }

  analyzeJobMatch(
    userId: bigint,
    role: UserRole,
    dto: AnalyzeJobMatchDto,
  ) {
    const jobId = BigInt(dto.jobId);
    const cvVersionId = BigInt(dto.cvVersionId);
    if (role === UserRole.STUDENT) {
      return this.runAnalysis({
        requesterId: userId,
        requesterRole: role,
        cvVersionId,
        jobId,
        analysisType: AnalysisType.JOB_MATCH,
        forceRefresh: dto.forceRefresh === true,
      });
    }
    if (role === UserRole.COMPANY) {
      return this.runAnalysisForCompanyApplication(
        userId,
        cvVersionId,
        jobId,
        dto.forceRefresh === true,
      );
    }
    throw new ForbiddenException('Không có quyền phân tích AI');
  }

  private async runAnalysisForCompanyApplication(
    companyUserId: bigint,
    cvVersionId: bigint,
    jobId: bigint,
    forceRefresh: boolean,
  ) {
    const company = await getCompanyProfileForUser(
      this.prisma,
      companyUserId,
    );
    const application = await this.prisma.application.findFirst({
      where: {
        jobId,
        cvVersionId,
        job: { companyId: company.companyId },
      },
    });
    if (!application) {
      throw new ForbiddenException(
        'Chỉ phân tích ứng viên đã nộp hồ sơ vào tin của bạn',
      );
    }
    return this.runAnalysis({
      requesterId: companyUserId,
      requesterRole: UserRole.COMPANY,
      cvVersionId,
      jobId,
      analysisType: AnalysisType.JOB_MATCH,
      forceRefresh,
    });
  }

  private async runAnalysis(input: {
    requesterId: bigint;
    requesterRole: UserRole;
    cvVersionId: bigint;
    jobId: bigint | null;
    analysisType: AnalysisType;
    forceRefresh: boolean;
  }) {
    const cvVersion = await this.prisma.cvVersion.findUnique({
      where: { cvVersionId: input.cvVersionId },
      include: { cv: true },
    });
    if (!cvVersion) {
      throw new NotFoundException('Không tìm thấy phiên bản CV');
    }

    if (input.requesterRole === UserRole.STUDENT) {
      if (cvVersion.cv.studentUserId !== input.requesterId) {
        throw new ForbiddenException('CV không thuộc về bạn');
      }
    }

    if (input.analysisType === AnalysisType.JOB_MATCH) {
      if (!input.jobId) {
        throw new NotFoundException('Thiếu tin tuyển dụng');
      }
      const job = await this.prisma.job.findFirst({
        where: {
          jobId: input.jobId,
          deletedAt: null,
          status: {
            in: [JobStatus.APPROVED, JobStatus.PAUSED],
          },
        },
      });
      if (!job) {
        throw new NotFoundException('Tin tuyển dụng không khả dụng');
      }
      if (input.requesterRole === UserRole.COMPANY) {
        const company = await getCompanyProfileForUser(
          this.prisma,
          input.requesterId,
        );
        if (job.companyId !== company.companyId) {
          throw new ForbiddenException('Không có quyền với tin này');
        }
      }
    }

    if (!input.forceRefresh) {
      const cached = await this.prisma.cvAiAnalysis.findFirst({
        where: {
          cvVersionId: input.cvVersionId,
          jobId: input.jobId,
          analysisType: input.analysisType,
          status: AnalysisStatus.COMPLETED,
        },
        orderBy: { completedAt: 'desc' },
        include: {
          job: { select: { title: true, slug: true, jobId: true } },
        },
      });
      if (cached) {
        return { ...cached, cached: true };
      }

      const inFlight = await this.prisma.cvAiAnalysis.findFirst({
        where: {
          cvVersionId: input.cvVersionId,
          jobId: input.jobId,
          analysisType: input.analysisType,
          status: { in: [AnalysisStatus.PENDING, AnalysisStatus.PROCESSING] },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          job: { select: { title: true, slug: true, jobId: true } },
        },
      });
      if (inFlight) {
        return inFlight;
      }
    }

    const record = await this.prisma.cvAiAnalysis.create({
      data: {
        cvVersionId: input.cvVersionId,
        jobId: input.jobId,
        requestedBy: input.requesterId,
        analysisType: input.analysisType,
        status: AnalysisStatus.PROCESSING,
      },
      include: {
        job: { select: { title: true, slug: true, jobId: true } },
      },
    });

    const eventPayload: AiAnalysisRequestedPayload = {
      analysisId: record.analysisId,
    };
    this.events.emit(AI_ANALYSIS_REQUESTED, eventPayload);

    return record;
  }

  async listMine(userId: bigint, role: UserRole) {
    if (role === UserRole.STUDENT) {
      return this.prisma.cvAiAnalysis.findMany({
        where: {
          cvVersion: { cv: { studentUserId: userId } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          job: { select: { title: true, slug: true, jobId: true } },
        },
      });
    }
    if (role === UserRole.COMPANY) {
      const company = await getCompanyProfileForUser(this.prisma, userId);
      return this.prisma.cvAiAnalysis.findMany({
        where: {
          analysisType: AnalysisType.JOB_MATCH,
          job: { companyId: company.companyId },
          cvVersion: {
            applications: {
              some: { job: { companyId: company.companyId } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          job: { select: { title: true, slug: true, jobId: true } },
          cvVersion: {
            include: {
              cv: { select: { cvName: true, studentUserId: true } },
            },
          },
        },
      });
    }
    throw new ForbiddenException('Không có quyền');
  }

  async getById(userId: bigint, role: UserRole, analysisId: bigint) {
    const analysis = await this.prisma.cvAiAnalysis.findUnique({
      where: { analysisId },
      include: {
        job: true,
        cvVersion: { include: { cv: true } },
      },
    });
    if (!analysis) {
      throw new NotFoundException('Không tìm thấy phân tích');
    }

    if (role === UserRole.STUDENT) {
      if (analysis.cvVersion.cv.studentUserId !== userId) {
        throw new ForbiddenException('Không có quyền xem phân tích này');
      }
      return analysis;
    }

    if (role === UserRole.COMPANY) {
      if (analysis.analysisType !== AnalysisType.JOB_MATCH || !analysis.jobId) {
        throw new ForbiddenException('Công ty chỉ xem phân tích JOB_MATCH');
      }
      const company = await getCompanyProfileForUser(this.prisma, userId);
      if (analysis.job!.companyId !== company.companyId) {
        throw new ForbiddenException('Không có quyền');
      }
      const applied = await this.prisma.application.findFirst({
        where: {
          jobId: analysis.jobId,
          cvVersionId: analysis.cvVersionId,
        },
      });
      if (!applied) {
        throw new ForbiddenException(
          'Ứng viên chưa ứng tuyển tin này với phiên bản CV này',
        );
      }
      return analysis;
    }

    if (role === UserRole.STAFF || role === UserRole.SUPER_ADMIN) {
      return analysis;
    }

    throw new ForbiddenException('Không có quyền');
  }

  async getForApplication(
    companyUserId: bigint,
    applicationId: bigint,
  ) {
    const company = await getCompanyProfileForUser(
      this.prisma,
      companyUserId,
    );
    const app = await this.prisma.application.findFirst({
      where: { applicationId },
      include: { job: true },
    });
    if (!app || app.job.companyId !== company.companyId) {
      throw new ForbiddenException('Không có quyền');
    }
    return this.prisma.cvAiAnalysis.findFirst({
      where: {
        cvVersionId: app.cvVersionId,
        jobId: app.jobId,
        analysisType: AnalysisType.JOB_MATCH,
        status: AnalysisStatus.COMPLETED,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        job: { select: { title: true, jobId: true } },
      },
    });
  }

  private formatJob(job: {
    title: string;
    description: string;
    requirements: string;
    benefits?: string | null;
    location: string;
    jobType: string;
  }) {
    return [
      `Tiêu đề: ${job.title}`,
      `Loại: ${job.jobType}`,
      `Địa điểm: ${job.location}`,
      `Mô tả: ${job.description}`,
      `Yêu cầu: ${job.requirements}`,
      job.benefits ? `Quyền lợi: ${job.benefits}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }
}
