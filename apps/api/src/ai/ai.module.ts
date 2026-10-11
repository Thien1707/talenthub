import { Module } from '@nestjs/common';
import { AiAnalysisListener } from './ai-analysis.listener';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';

@Module({
  controllers: [AiController],
  providers: [AiService, GeminiService, AiAnalysisListener],
  exports: [AiService],
})
export class AiModule {}
