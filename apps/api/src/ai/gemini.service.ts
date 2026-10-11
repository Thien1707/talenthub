import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalysisType } from '@prisma/client';
import {
  GeminiAnalysisPayload,
  parseGeminiAnalysis,
} from './ai-analysis.types';

@Injectable()
export class GeminiService {
  constructor(private readonly config: ConfigService) {}

  async analyzeCv(input: {
    analysisType: AnalysisType;
    cvText: string;
    jobText?: string;
  }): Promise<{ modelName: string; payload: GeminiAnalysisPayload }> {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey?.trim()) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình GEMINI_API_KEY trong .env',
      );
    }
    const modelName =
      this.config.get<string>('GEMINI_MODEL') ?? 'gemini-2.0-flash';

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

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

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text?.trim()) {
      throw new ServiceUnavailableException('Gemini không trả về nội dung');
    }
    return { modelName, payload: parseGeminiAnalysis(text) };
  }
}
