import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  JobStatus,
  OrderItemType,
  OrderStatus,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { getCompanyProfileForUser } from '../common/utils/company-access.util';
import { PricingService } from '../pricing/pricing.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: PricingService,
    private readonly wallet: WalletService,
  ) {}

  async createPostOrder(userId: bigint, jobId: bigint) {
    const company = await getCompanyProfileForUser(this.prisma, userId);
    const job = await this.prisma.job.findFirst({
      where: { jobId, companyId: company.companyId, deletedAt: null },
    });
    if (!job) throw new NotFoundException('Không tìm thấy tin');
    if (job.isPaid) {
      throw new BadRequestException('Tin đã được thanh toán hoặc dùng quota');
    }
    if (
      job.status !== JobStatus.DRAFT &&
      job.status !== JobStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Chỉ tạo đơn cho tin nháp hoặc bị từ chối',
      );
    }

    const plan = await this.pricing.getPlanForJobType(job.jobType);
    if (!plan) {
      throw new BadRequestException('Chưa cấu hình bảng giá');
    }

    const orderCode = `TH-${Date.now()}-${randomBytes(3).toString('hex')}`;
    const unitPrice = plan.price;
    const itemType =
      job.jobType === 'VIP' ? OrderItemType.VIP_UPGRADE : OrderItemType.NORMAL_POST;

    return this.prisma.order.create({
      data: {
        orderCode,
        companyId: company.companyId,
        subtotal: unitPrice,
        discountAmount: 0,
        totalAmount: unitPrice,
        currency: plan.currency,
        status: OrderStatus.PENDING,
        items: {
          create: {
            planId: plan.planId,
            jobId: job.jobId,
            itemType,
            itemName: plan.planName,
            quantity: 1,
            unitPrice,
            totalPrice: unitPrice,
          },
        },
      },
      include: { items: true },
    });
  }

  async listCompanyOrders(userId: bigint) {
    const company = await getCompanyProfileForUser(this.prisma, userId);
    return this.prisma.order.findMany({
      where: { companyId: company.companyId },
      orderBy: { createdAt: 'desc' },
      include: { items: true, payments: true },
    });
  }

  async getCompanyOrder(userId: bigint, orderId: bigint) {
    const company = await getCompanyProfileForUser(this.prisma, userId);
    const order = await this.prisma.order.findFirst({
      where: { orderId, companyId: company.companyId },
      include: { items: true, payments: true },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }

  async fulfillPaidOrder(orderId: bigint) {
    const preview = await this.prisma.order.findUnique({
      where: { orderId },
      include: { items: true },
    });
    if (!preview || preview.status === OrderStatus.PAID) return preview;
    if (
      preview.items.some((i) => i.itemType === OrderItemType.WALLET_TOPUP)
    ) {
      return this.wallet.creditFromPaidOrder(orderId);
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { orderId },
        include: { items: true },
      });
      if (!order || order.status === OrderStatus.PAID) return order;

      await tx.order.update({
        where: { orderId },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
      });

      for (const item of order.items) {
        if (item.jobId) {
          await tx.job.update({
            where: { jobId: item.jobId },
            data: { isPaid: true },
          });
          const quota = await tx.companyPostingQuota.findUnique({
            where: { companyId: order.companyId },
          });
          if (quota) {
            await tx.companyPostingQuota.update({
              where: { companyId: order.companyId },
              data: { paidPostCount: { increment: 1 } },
            });
          }
        }
      }

      return tx.order.findUnique({
        where: { orderId },
        include: { items: true },
      });
    });
  }
}
