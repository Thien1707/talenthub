import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  type GenerationConfig,
} from '@google/generative-ai';
import { AnalysisType } from '@prisma/client';
import { CvContent } from '../cvs/cv-content.schema';
import {
  GeminiAnalysisPayload,
  parseGeminiAnalysis,
} from './ai-analysis.types';
import {
  compactCvForPrompt,
  cvContentSchemaHint,
  parseCvBuildChatResponse,
  type CvBuildChatMessage,
} from './cv-build-chat.types';

/** Model 2.5 trả 404 với key mới — dùng alias *-latest / 3.x (đã kiểm tra generateContent). */
const GEMINI_MODEL_FALLBACKS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
] as const;

const GEMINI_CHAT_MODEL_FALLBACKS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
] as const;

const GEMINI_REQUEST_TIMEOUT_MS = 50_000;

@Injectable()
export class GeminiService {
  constructor(private readonly config: ConfigService) {}

  private apiKey(): string {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey?.trim()) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình GEMINI_API_KEY trong .env',
      );
    }
    return apiKey.trim();
  }

  private modelCandidates(extra?: readonly string[]): string[] {
    const configured = this.config.get<string>('GEMINI_MODEL')?.trim();
    const chain = extra ?? GEMINI_MODEL_FALLBACKS;
    const ordered = [configured, ...chain].filter((m): m is string => Boolean(m));
    return [...new Set(ordered)];
  }

  private shouldFailFast(error: unknown): boolean {
    const msg = String((error as { message?: string })?.message ?? error);
    return (
      /API key|API_KEY|401|403|PERMISSION|invalid/i.test(msg) ||
      msg.includes('timeout') ||
      msg.includes('Timeout')
    );
  }

  private isModelUnavailable(error: unknown): boolean {
    const msg = String((error as { message?: string })?.message ?? error);
    return (
      msg.includes('404') ||
      msg.includes('503') ||
      /no longer available/i.test(msg) ||
      /high demand/i.test(msg) ||
      /not found/i.test(msg)
    );
  }

  private toClientError(error: unknown): ServiceUnavailableException {
    if (error instanceof ServiceUnavailableException) return error;
    const msg = String((error as { message?: string })?.message ?? error);
    if (this.isModelUnavailable(error)) {
      return new ServiceUnavailableException(
        `Model Gemini không khả dụng. Sửa GEMINI_MODEL trong apps/api/.env (thử gemini-flash-lite-latest hoặc gemini-3.5-flash-lite). Chi tiết: ${msg.slice(0, 200)}`,
      );
    }
    return new ServiceUnavailableException(
      `Gemini lỗi: ${msg.slice(0, 400)}`,
    );
  }

  private async generateText(
    prompt: string,
    generationConfig: GenerationConfig,
    modelChain?: readonly string[],
  ): Promise<{ modelName: string; text: string }> {
    const apiKey = this.apiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    let lastError: unknown;

    for (const modelName of this.modelCandidates(modelChain)) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig,
        });
        const result = await Promise.race([
          model.generateContent(prompt),
          new Promise<never>((_, reject) => {
            setTimeout(
              () => reject(new Error('Gemini timeout — thử lại')),
              GEMINI_REQUEST_TIMEOUT_MS,
            );
          }),
        ]);
        const text = result.response.text();
        if (!text?.trim()) {
          lastError = new Error('Gemini trả về rỗng');
          continue;
        }
        return { modelName, text };
      } catch (error) {
        lastError = error;
        if (this.shouldFailFast(error)) throw this.toClientError(error);
        if (this.isModelUnavailable(error)) continue;
        throw this.toClientError(error);
      }
    }

    throw this.toClientError(lastError);
  }

  async analyzeCv(input: {
    analysisType: AnalysisType;
    cvText: string;
    jobText?: string;
  }): Promise<{ modelName: string; payload: GeminiAnalysisPayload }> {
    const mode =
      input.analysisType === AnalysisType.JOB_MATCH
        ? 'JOB_MATCH (đối chiếu CV với tin tuyển dụng)'
        : 'GENERAL (đánh giá chất lượng CV tổng quát)';

    const prompt = [
      'Bạn là chuyên gia tuyển dụng và career coach tại Việt Nam.',
      `Chế độ phân tích: ${mode}.`,
      'Trả về ĐÚNG một JSON object (không markdown) với các khóa:',
      'score, skillMatchScore, experienceMatchScore, educationMatchScore (số 0-100),',
      'strengths, weaknesses, recommendations (mảng chuỗi tiếng Việt, ngắn gọn),',
      'summary (đoạn tóm tắt tiếng Việt).',
      input.analysisType === AnalysisType.JOB_MATCH && input.jobText
        ? `\n--- TIN TUYỂN DỤNG ---\n${input.jobText}\n`
        : '',
      `\n--- NỘI DUNG CV ---\n${input.cvText.slice(0, 24_000)}`,
    ]
      .filter(Boolean)
      .join('\n');

    const { modelName, text } = await this.generateText(prompt, {
      responseMimeType: 'application/json',
      temperature: 0.4,
    });

    try {
      return { modelName, payload: parseGeminiAnalysis(text) };
    } catch {
      throw new ServiceUnavailableException(
        'Gemini trả JSON không hợp lệ — thử gửi lại',
      );
    }
  }

  async cvBuildChat(input: {
    messages: CvBuildChatMessage[];
    currentContent: CvContent;
    jobTitle?: string;
  }): Promise<{ modelName: string; result: ReturnType<typeof parseCvBuildChatResponse> }> {
    const history = input.messages
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'Sinh viên' : 'Trợ lý'}: ${m.content.slice(0, 2000)}`)
      .join('\n\n');

    const prompt = [
      'Trợ lý CV sinh viên VN. Trả JSON (không markdown):',
      '{"message":"...","patch":{...}} HOẶC {"message":"...","content":{...}}',
      '- message: tiếng Việt, ngắn.',
      '- patch: CHỈ field cần đổi (vd skills, personal.summary) — ưu tiên, nhanh.',
      '- content: full CV — chỉ khi user yêu cầu tạo CV mới từ đầu.',
      'Schema:',
      cvContentSchemaHint(),
      input.jobTitle ? `Vị trí nhắm: ${input.jobTitle.slice(0, 120)}` : '',
      'CV hiện tại (rút gọn):',
      compactCvForPrompt(input.currentContent),
      'Hội thoại:',
      history,
    ]
      .filter(Boolean)
      .join('\n');

    const { modelName, text } = await this.generateText(
      prompt,
      {
        responseMimeType: 'application/json',
        temperature: 0.45,
        maxOutputTokens: 4096,
      },
      GEMINI_CHAT_MODEL_FALLBACKS,
    );

    try {
      return {
        modelName,
        result: parseCvBuildChatResponse(text, input.currentContent),
      };
    } catch {
      throw new ServiceUnavailableException(
        'Gemini trả JSON CV không hợp lệ — thử hỏi lại ngắn gọn hơn',
      );
    }
  }
}
