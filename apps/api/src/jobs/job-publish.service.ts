import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  JobPublishRequestStatus,
  JobStatus,
  JobType,
  PromotionFeatureCode,
} from '@prisma/client';
import {
  assertCompanyOwnsJob,
  getCompanyProfileForUser,
} from '../common/utils/company-access.util';
import { calculatePostingQuote } from '../posting/posting-quote.util';
import { PostingFeeService } from '../posting/posting-fee.service';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class JobPublishService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postingFee: PostingFeeService,
    private readonly wallet: WalletService,
  ) {}

  async getPublishQuote(
    userId: bigint,
    jobId: bigint,
    selectedCodes: PromotionFeatureCode[] = [],
  ) {
    const company = await getCompanyProfileForUser(this.prisma, userId);
    const job = await this.getEditableJob(jobId);
    assertCompanyOwnsJob(company.companyId, job.companyId);

    await this.wallet.ensureWallet(company.companyId);
    const wallet = await this.prisma.companyWallet.findUniqueOrThrow({
      where: { companyId: company.companyId },
    });
    const quota = await this.prisma.companyPostingQuota.findUnique({
      where: { companyId: company.companyId },
    });
    if (!quota) {
      throw new BadRequestException('Chưa cấu hình quota đăng tin');
    }

    const quote = await this.postingFee.buildQuote({
      jobType: job.jobType,
      freePostUsed: quota.freePostUsed,
      freePostAllowance: quota.freePostLimit,
      selectedCodes,
    });

    const balance = Number(wallet.balanceVnd);
    return {
      job: {
        jobId: job.jobId.toString(),
        title: job.title,
        jobType: job.jobType,
        status: job.status,
      },
      companyName: company.companyName,
      walletBalanceVnd: balance,
      balanceAfterVnd: balance - quote.totalVnd,
      freePostUsed: quota.freePostUsed,
      freePostLimit: quota.freePostLimit,
      ...quote,
      availablePromotions: (
        await this.postingFee.listActivePromotions()
      ).map((p) => ({
        code: p.code,
        displayName: p.displayName,
        description: p.description,
        priceVnd: p.priceVnd,
        durationDays: p.durationDays,
      })),
    };
  }

  async publishJob(
    userId: bigint,
    jobId: bigint,
    selectedCodes: PromotionFeatureCode[],
    idempotencyKey: string,
  ) {
    if (!idempotencyKey || idempotencyKey.length < 8) {
      throw new BadRequestException('Thiếu idempotencyKey');
    }

    const existingReq = await this.prisma.jobPublishRequest.findUnique({
      where: { idempotencyKey },
    });
    if (existingReq?.status === JobPublishRequestStatus.COMPLETED && existingReq.response) {
      return existingReq.response;
    }
    if (existingReq?.status === JobPublishRequestStatus.PROCESSING) {
      throw new BadRequestException('Yêu cầu đang xử lý — vui lòng đợi');
    }
    if (existingReq?.status === JobPublishRequestStatus.FAILED) {
      await this.prisma.jobPublishRequest.delete({
        where: { idempotencyKey },
      });
    }

    const company = await getCompanyProfileForUser(this.prisma, userId);
    const job = await this.getEditableJob(jobId);
    assertCompanyOwnsJob(company.companyId, job.companyId);

    await this.wallet.ensureWallet(company.companyId);

    const publishReq = await this.prisma.jobPublishRequest.create({
      data: {
        idempotencyKey,
        jobId,
        companyId: company.companyId,
        status: JobPublishRequestStatus.PROCESSING,
      },
    });

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT quota_id FROM company_posting_quotas WHERE company_id = ${company.companyId} FOR UPDATE`;

        const freshJob = await tx.job.findUnique({ where: { jobId } });
        if (!freshJob || freshJob.deletedAt) {
          throw new NotFoundException('Không tìm thấy tin');
        }
        if (
          freshJob.status !== JobStatus.DRAFT &&
          freshJob.status !== JobStatus.REJECTED
        ) {
          throw new BadRequestException('Tin không thể gửi duyệt ở trạng thái hiện tại');
        }

        const quota = await tx.companyPostingQuota.findUniqueOrThrow({
          where: { companyId: company.companyId },
        });

        const config = await this.postingFee.getConfig();
        const promoDefs = await tx.promotionFeatureDefinition.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        });
        const quote = calculatePostingQuote({
          jobType: freshJob.jobType,
          freePostUsed: quota.freePostUsed,
          freePostAllowance: quota.freePostLimit,
          basePostFeeVnd: config.basePostFeeVnd,
          selectedCodes,
          availablePromotions: promoDefs.map((p) => ({
            code: p.code,
            displayName: p.displayName,
            priceVnd: p.priceVnd,
            durationDays: p.durationDays,
          })),
        });

        const validCodes = new Set(
          quote.promotionLines.map((p) => p.code),
        );
        for (const code of selectedCodes) {
          if (!validCodes.has(code)) {
            throw new BadRequestException(`Gói quảng bá không hợp lệ: ${code}`);
          }
        }

        const txLines: { label: string; amountVnd: number; featureCode?: string }[] = [];
        if (quote.baseFeeVnd > 0) {
          txLines.push({
            label: 'Phí đăng tin',
            amountVnd: quote.baseFeeVnd,
          });
        }
        for (const p of quote.promotionLines) {
          txLines.push({
            label: p.displayName,
            amountVnd: p.priceVnd,
            featureCode: p.code,
          });
        }

        let walletTx = null;
        if (quote.totalVnd > 0) {
          walletTx = await this.wallet.debitInTransaction(tx, {
            companyId: company.companyId,
            jobId,
            amountVnd: quote.totalVnd,
            idempotencyKey,
            lines: txLines,
          });
        }

        let isPaid = freshJob.isPaid;
        let quotaConsumed = freshJob.quotaConsumed;

        if (quote.qualifiesForFreeBase && quote.totalVnd === 0) {
          await tx.companyPostingQuota.update({
            where: { companyId: company.companyId },
            data: { freePostUsed: { increment: 1 } },
          });
          quotaConsumed = true;
          isPaid = true;
        } else if (quote.totalVnd > 0) {
          isPaid = true;
          await tx.companyPostingQuota.update({
            where: { companyId: company.companyId },
            data: { paidPostCount: { increment: 1 } },
          });
        } else if (quote.qualifiesForFreeBase && quote.promotionTotalVnd > 0) {
          await tx.companyPostingQuota.update({
            where: { companyId: company.companyId },
            data: { freePostUsed: { increment: 1 } },
          });
          quotaConsumed = true;
          isPaid = true;
        }

        const now = new Date();
        const promotionUpdates: {
          promotionTopUntil?: Date;
          highlightUntil?: Date;
          featuredUntil?: Date;
        } = {};

        const promotions = await tx.promotionFeatureDefinition.findMany({
          where: { code: { in: selectedCodes }, isActive: true },
        });

        for (const def of promotions) {
          const expires = new Date(
            now.getTime() + def.durationDays * 86_400_000,
          );
          await tx.jobPromotion.create({
            data: {
              jobId,
              featureId: def.featureId,
              code: def.code,
              priceVnd: def.priceVnd,
              startsAt: now,
              expiresAt: expires,
            },
          });
          if (def.code === PromotionFeatureCode.TOP_LISTING) {
            promotionUpdates.promotionTopUntil = expires;
          }
          if (def.code === PromotionFeatureCode.HIGHLIGHT) {
            promotionUpdates.highlightUntil = expires;
          }
          if (def.code === PromotionFeatureCode.FEATURED) {
            promotionUpdates.featuredUntil = expires;
          }
        }

        const updatedJob = await tx.job.update({
          where: { jobId },
          data: {
            status: JobStatus.PENDING,
            isPaid,
            quotaConsumed,
            rejectionReason: null,
            ...promotionUpdates,
          },
        });

        await tx.jobStatusHistory.create({
          data: {
            jobId,
            oldStatus: freshJob.status,
            newStatus: JobStatus.PENDING,
            changedBy: userId,
            reason: 'Gửi kiểm duyệt (thanh toán ví)',
          },
        });

        const wallet = await tx.companyWallet.findUniqueOrThrow({
          where: { companyId: company.companyId },
        });

        return {
          job: updatedJob,
          totalVnd: quote.totalVnd,
          walletBalanceVnd: wallet.balanceVnd.toString(),
          transactionId: walletTx?.transactionId.toString() ?? null,
        };
      });

      const response = {
        jobId: result.job.jobId.toString(),
        status: result.job.status,
        totalVnd: result.totalVnd,
        walletBalanceVnd: result.walletBalanceVnd,
        transactionId: result.transactionId,
      };

      await this.prisma.jobPublishRequest.update({
        where: { requestId: publishReq.requestId },
        data: {
          status: JobPublishRequestStatus.COMPLETED,
          totalVnd: result.totalVnd,
          walletTransactionId: result.transactionId
            ? BigInt(result.transactionId)
            : undefined,
          response,
          completedAt: new Date(),
        },
      });

      return response;
    } catch (err) {
      await this.prisma.jobPublishRequest.update({
        where: { requestId: publishReq.requestId },
        data: { status: JobPublishRequestStatus.FAILED },
      });
      throw err;
    }
  }

  private async getEditableJob(jobId: bigint) {
    const job = await this.prisma.job.findUnique({ where: { jobId } });
    if (!job || job.deletedAt) {
      throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    }
    return job;
  }
}
