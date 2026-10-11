import { Injectable } from '@nestjs/common';
import { PlanType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  listActivePlans() {
    return this.prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async getPlanForJobType(jobType: 'NORMAL' | 'VIP') {
    const planType =
      jobType === 'VIP' ? PlanType.VIP_POST : PlanType.NORMAL_POST;
    const plan = await this.prisma.pricingPlan.findFirst({
      where: { isActive: true, planType },
      orderBy: { effectiveFrom: 'desc' },
    });
    return plan;
  }
}
