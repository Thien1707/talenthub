import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PromotionFeatureCode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculatePostingQuote,
  type PostingQuoteResult,
} from './posting-quote.util';

@Injectable()
export class PostingFeeService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig() {
    let config = await this.prisma.postingFeeConfig.findFirst();
    if (!config) {
      config = await this.prisma.postingFeeConfig.create({
        data: { basePostFeeVnd: 5000, freePostAllowance: 3 },
      });
    }
    return config;
  }

  async listActivePromotions() {
    return this.prisma.promotionFeatureDefinition.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  listAllPromotions() {
    return this.prisma.promotionFeatureDefinition.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async buildQuote(params: {
    jobType: 'NORMAL' | 'VIP';
    freePostUsed: number;
    freePostAllowance: number;
    selectedCodes: PromotionFeatureCode[];
  }): Promise<PostingQuoteResult & { config: Awaited<ReturnType<PostingFeeService['getConfig']>> }> {
    const config = await this.getConfig();
    const promotions = await this.listActivePromotions();
    const quote = calculatePostingQuote({
      jobType: params.jobType,
      freePostUsed: params.freePostUsed,
      freePostAllowance: params.freePostAllowance ?? config.freePostAllowance,
      basePostFeeVnd: config.basePostFeeVnd,
      selectedCodes: params.selectedCodes,
      availablePromotions: promotions.map((p) => ({
        code: p.code,
        displayName: p.displayName,
        priceVnd: p.priceVnd,
        durationDays: p.durationDays,
      })),
    });
    return { ...quote, config };
  }

  async updateConfig(data: {
    basePostFeeVnd?: number;
    freePostAllowance?: number;
  }) {
    const config = await this.getConfig();
    if (data.basePostFeeVnd != null && data.basePostFeeVnd < 0) {
      throw new BadRequestException('Phí đăng tin không hợp lệ');
    }
    if (data.freePostAllowance != null && data.freePostAllowance < 0) {
      throw new BadRequestException('Lượt miễn phí không hợp lệ');
    }
    return this.prisma.postingFeeConfig.update({
      where: { configId: config.configId },
      data,
    });
  }

  async patchPromotion(
    code: PromotionFeatureCode,
    data: {
      displayName?: string;
      description?: string;
      priceVnd?: number;
      durationDays?: number;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    const existing = await this.prisma.promotionFeatureDefinition.findUnique({
      where: { code },
    });
    if (!existing) {
      throw new NotFoundException('Không tìm thấy gói quảng bá');
    }
    if (data.priceVnd != null && data.priceVnd < 0) {
      throw new BadRequestException('Giá quảng bá không hợp lệ');
    }
    if (data.durationDays != null && data.durationDays < 1) {
      throw new BadRequestException('Thời hạn phải ít nhất 1 ngày');
    }
    return this.prisma.promotionFeatureDefinition.update({
      where: { code },
      data,
    });
  }
}
