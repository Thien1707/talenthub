import { JobType, PromotionFeatureCode } from '@prisma/client';

export type PromotionLine = {
  code: PromotionFeatureCode;
  displayName: string;
  priceVnd: number;
  durationDays: number;
};

export type PostingQuoteInput = {
  jobType: JobType;
  freePostUsed: number;
  freePostAllowance: number;
  basePostFeeVnd: number;
  selectedCodes: PromotionFeatureCode[];
  availablePromotions: PromotionLine[];
};

export type PostingQuoteResult = {
  qualifiesForFreeBase: boolean;
  baseFeeVnd: number;
  promotionLines: PromotionLine[];
  promotionTotalVnd: number;
  totalVnd: number;
};

/**
 * Quy tắc đếm lượt miễn phí (đồng bộ backend):
 * - Chỉ tin NORMAL mới dùng lượt miễn phí.
 * - Lượt được tiêu thụ khi gửi duyệt thành công (PENDING), tăng freePostUsed — không hoàn lại khi xóa nháp.
 * - Tin VIP luôn tính phí đăng cơ bản (không dùng lượt miễn phí).
 */
export function calculatePostingQuote(
  input: PostingQuoteInput,
): PostingQuoteResult {
  const qualifiesForFreeBase =
    input.jobType === JobType.NORMAL &&
    input.freePostUsed < input.freePostAllowance;

  const baseFeeVnd = qualifiesForFreeBase ? 0 : input.basePostFeeVnd;

  const selected = new Set(input.selectedCodes);
  const promotionLines = input.availablePromotions.filter((p) =>
    selected.has(p.code),
  );
  const promotionTotalVnd = promotionLines.reduce(
    (sum, p) => sum + p.priceVnd,
    0,
  );

  return {
    qualifiesForFreeBase,
    baseFeeVnd,
    promotionLines,
    promotionTotalVnd,
    totalVnd: baseFeeVnd + promotionTotalVnd,
  };
}
