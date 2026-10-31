import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderItemType,
  OrderStatus,
  Prisma,
  WalletTransactionStatus,
  WalletTransactionType,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { getCompanyProfileForUser } from '../common/utils/company-access.util';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureWallet(companyId: bigint) {
    const existing = await this.prisma.companyWallet.findUnique({
      where: { companyId },
    });
    if (existing) return existing;
    return this.prisma.companyWallet.create({
      data: { companyId, balanceVnd: BigInt(0) },
    });
  }

  async getWalletForUser(userId: bigint) {
    const company = await getCompanyProfileForUser(this.prisma, userId);
    const wallet = await this.ensureWallet(company.companyId);
    return {
      balanceVnd: wallet.balanceVnd.toString(),
      walletId: wallet.walletId.toString(),
      companyId: company.companyId.toString(),
    };
  }

  async listTransactions(userId: bigint, limit = 30) {
    const company = await getCompanyProfileForUser(this.prisma, userId);
    return this.prisma.walletTransaction.findMany({
      where: { companyId: company.companyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { lines: true },
    });
  }

  async createTopUpOrder(userId: bigint, amountVnd: number) {
    const MIN_TOPUP_VND = 5_000;
    if (!Number.isInteger(amountVnd) || amountVnd < MIN_TOPUP_VND) {
      throw new BadRequestException(
        `Số tiền nạp tối thiểu ${MIN_TOPUP_VND.toLocaleString('en-US')} VND`,
      );
    }
    const company = await getCompanyProfileForUser(this.prisma, userId);
    const orderCode = `TH-WALLET-${Date.now()}-${randomBytes(3).toString('hex')}`;
    return this.prisma.order.create({
      data: {
        orderCode,
        companyId: company.companyId,
        subtotal: amountVnd,
        discountAmount: 0,
        totalAmount: amountVnd,
        currency: 'VND',
        status: OrderStatus.PENDING,
        notes: 'Nạp ví đăng tin',
        items: {
          create: {
            itemType: OrderItemType.WALLET_TOPUP,
            itemName: `Nạp ví ${amountVnd.toLocaleString('vi-VN')} VND`,
            quantity: 1,
            unitPrice: amountVnd,
            totalPrice: amountVnd,
          },
        },
      },
      include: { items: true },
    });
  }

  async creditFromPaidOrder(orderId: bigint) {
    const preview = await this.prisma.order.findUnique({
      where: { orderId },
      include: { items: true },
    });
    if (!preview) return null;
    if (preview.status === OrderStatus.PAID) return preview;

    const topUpItem = preview.items.find(
      (i) => i.itemType === OrderItemType.WALLET_TOPUP,
    );
    if (!topUpItem) return null;

    const amount = Math.round(Number(preview.totalAmount));
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new BadRequestException('Invalid top-up amount');
    }

    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { orderId } });
      if (!order || order.status === OrderStatus.PAID) return;

      const updated = await tx.order.updateMany({
        where: { orderId, status: OrderStatus.PENDING },
        data: { status: OrderStatus.PAID, paidAt: new Date() },
      });
      if (updated.count === 0) return;

      const wallet = await tx.companyWallet.upsert({
        where: { companyId: order.companyId },
        create: { companyId: order.companyId, balanceVnd: BigInt(amount) },
        update: {
          balanceVnd: { increment: BigInt(amount) },
          version: { increment: 1 },
        },
      });

      const newBalance = wallet.balanceVnd;
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.walletId,
          companyId: order.companyId,
          type: WalletTransactionType.DEPOSIT,
          status: WalletTransactionStatus.COMPLETED,
          amountVnd: BigInt(amount),
          balanceAfterVnd: newBalance,
          description: `Nạp ví qua VNPAY — ${order.orderCode}`,
          completedAt: new Date(),
          metadata: { orderId: orderId.toString() },
        },
      });
    });

    return this.prisma.order.findUnique({ where: { orderId } });
  }

  /**
   * Trừ ví trong transaction hiện có. amountVnd > 0.
   */
  async debitInTransaction(
    tx: Prisma.TransactionClient,
    params: {
      companyId: bigint;
      jobId: bigint;
      amountVnd: number;
      idempotencyKey: string;
      lines: { label: string; amountVnd: number; featureCode?: string }[];
    },
  ) {
    if (params.amountVnd <= 0) {
      return null;
    }

    await tx.$executeRaw`SELECT wallet_id FROM company_wallets WHERE company_id = ${params.companyId} FOR UPDATE`;

    const wallet = await tx.companyWallet.findUnique({
      where: { companyId: params.companyId },
    });
    if (!wallet) {
      throw new BadRequestException('Chưa có ví — liên hệ hỗ trợ');
    }

    const debit = BigInt(params.amountVnd);
    if (wallet.balanceVnd < debit) {
      throw new BadRequestException(
        'Số dư ví không đủ. Vui lòng nạp thêm trước khi đăng tin.',
      );
    }

    const existing = await tx.walletTransaction.findUnique({
      where: { idempotencyKey: params.idempotencyKey },
    });
    if (existing?.status === WalletTransactionStatus.COMPLETED) {
      return existing;
    }

    const updated = await tx.companyWallet.update({
      where: { walletId: wallet.walletId },
      data: {
        balanceVnd: { decrement: debit },
        version: { increment: 1 },
      },
    });

    const balanceAfter = updated.balanceVnd;
    return tx.walletTransaction.create({
      data: {
        walletId: wallet.walletId,
        companyId: params.companyId,
        jobId: params.jobId,
        type: WalletTransactionType.JOB_PUBLISH,
        status: WalletTransactionStatus.COMPLETED,
        amountVnd: -debit,
        balanceAfterVnd: balanceAfter,
        idempotencyKey: params.idempotencyKey,
        description: 'Thanh toán đăng tin tuyển dụng',
        completedAt: new Date(),
        lines: {
          create: params.lines.map((l) => ({
            label: l.label,
            amountVnd: l.amountVnd,
            featureCode: l.featureCode as never,
          })),
        },
      },
      include: { lines: true },
    });
  }
}
