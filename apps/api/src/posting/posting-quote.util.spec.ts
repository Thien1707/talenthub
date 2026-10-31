import { JobType, PromotionFeatureCode } from '@prisma/client';
import { calculatePostingQuote } from './posting-quote.util';

const promos = [
  {
    code: PromotionFeatureCode.TOP_LISTING,
    displayName: 'Top',
    priceVnd: 10_000,
    durationDays: 7,
  },
  {
    code: PromotionFeatureCode.HIGHLIGHT,
    displayName: 'Highlight',
    priceVnd: 5_000,
    durationDays: 7,
  },
];

function quote(freeUsed: number, selected: PromotionFeatureCode[] = []) {
  return calculatePostingQuote({
    jobType: JobType.NORMAL,
    freePostUsed: freeUsed,
    freePostAllowance: 3,
    basePostFeeVnd: 5_000,
    selectedCodes: selected,
    availablePromotions: promos,
  });
}

describe('calculatePostingQuote', () => {
  it('1–3: first three eligible postings are free (base)', () => {
    expect(quote(0).baseFeeVnd).toBe(0);
    expect(quote(0).totalVnd).toBe(0);
    expect(quote(1).baseFeeVnd).toBe(0);
    expect(quote(2).baseFeeVnd).toBe(0);
  });

  it('4: fourth posting requires base fee', () => {
    const q = quote(3);
    expect(q.baseFeeVnd).toBe(5_000);
    expect(q.totalVnd).toBe(5_000);
  });

  it('5–6: free with no options is 0; paid without promo is base only', () => {
    expect(quote(0, []).totalVnd).toBe(0);
    expect(quote(3, []).totalVnd).toBe(5_000);
  });

  it('7–8: TOP promotion adds/removes 10_000 VND', () => {
    const withTop = quote(3, [PromotionFeatureCode.TOP_LISTING]);
    expect(withTop.totalVnd).toBe(15_000);
    const without = quote(3, []);
    expect(without.totalVnd).toBe(5_000);
  });

  it('VIP never qualifies for free base', () => {
    const q = calculatePostingQuote({
      jobType: JobType.VIP,
      freePostUsed: 0,
      freePostAllowance: 3,
      basePostFeeVnd: 5_000,
      selectedCodes: [],
      availablePromotions: promos,
    });
    expect(q.baseFeeVnd).toBe(5_000);
  });

  it('free base + paid promotion on 1st post', () => {
    const q = quote(0, [PromotionFeatureCode.TOP_LISTING]);
    expect(q.baseFeeVnd).toBe(0);
    expect(q.totalVnd).toBe(10_000);
  });
});
