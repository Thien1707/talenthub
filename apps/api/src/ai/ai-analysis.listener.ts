import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AnalysisStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from './gemini.service';
import {
  AI_ANALYSIS_REQUESTED,
  type AiAnalysisRequestedPayload,
} from './ai-analysis.events';

@Injectable()
export class AiAnalysisListener {
  private readonly logger = new Logger(AiAnalysisListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiService,
  ) {}

  @OnEvent(AI_ANALYSIS_REQUESTED, { async: true })
  async handleRequested(payload: AiAnalysisRequestedPayload) {
    const record = await this.prisma.cvAiAnalysis.findUnique({
      where: { analysisId: payload.analysisId },
      include: {
        cvVersion: true,
        job: true,
      },
    });
    if (!record || record.status !== AnalysisStatus.PROCESSING) {
      return;
    }

    const cvText =
      record.cvVersion.plainTextContent?.trim() ||
      JSON.stringify(record.cvVersion.contentJson ?? {}, null, 2);
    const jobText = record.job
      ? [
          `Tiêu đề: ${record.job.title}`,
          `Mô tả: ${record.job.description}`,
          `Yêu cầu: ${record.job.requirements}`,
        ].join('\n')
      : undefined;

    try {
      const { modelName, payload: result } = await this.gemini.analyzeCv({
        analysisType: record.analysisType,
        cvText,
        jobText,
      });

      await this.prisma.cvAiAnalysis.update({
        where: { analysisId: record.analysisId },
        data: {
          status: AnalysisStatus.COMPLETED,
          modelName,
          score: result.score,
          skillMatchScore: result.skillMatchScore,
          experienceMatchScore: result.experienceMatchScore,
          educationMatchScore: result.educationMatchScore,
          strengths: result.strengths as Prisma.InputJsonValue,
          weaknesses: result.weaknesses as Prisma.InputJsonValue,
          recommendations: result.recommendations as Prisma.InputJsonValue,
          analysisResult: result as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Phân tích AI thất bại';
      this.logger.warn(`Analysis ${record.analysisId} failed: ${message}`);
      await this.prisma.cvAiAnalysis.update({
        where: { analysisId: record.analysisId },
        data: {
          status: AnalysisStatus.FAILED,
          errorMessage: message.slice(0, 2000),
          completedAt: new Date(),
        },
      });
    }
  }
}
