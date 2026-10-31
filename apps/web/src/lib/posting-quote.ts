/** Đồng bộ logic với apps/api/src/posting/posting-quote.util.ts */
export type PromoCode = "TOP_LISTING" | "HIGHLIGHT" | "FEATURED";

export type PromotionOption = {
  code: PromoCode;
  priceVnd: number;
};

export function computePromotionTotals(
  baseFeeVnd: number,
  available: PromotionOption[],
  selectedCodes: PromoCode[],
) {
  const selected = new Set(selectedCodes);
  const lines = available.filter((p) => selected.has(p.code));
  const promotionTotalVnd = lines.reduce((sum, p) => sum + p.priceVnd, 0);
  return {
    promotionLines: lines,
    promotionTotalVnd,
    totalVnd: baseFeeVnd + promotionTotalVnd,
  };
}
