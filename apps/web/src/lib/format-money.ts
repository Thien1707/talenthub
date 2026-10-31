/** Prisma Decimal bị serialize sai thành { s, e, d } — khôi phục số nguyên VND. */
function parseBrokenDecimalObject(value: Record<string, unknown>): number | null {
  if (!("d" in value) || !("e" in value) || !("s" in value)) return null;
  const sign = Number(value.s);
  const exp = Number(value.e);
  if (!Number.isFinite(sign) || !Number.isFinite(exp)) return null;

  let chunks = value.d;
  if (chunks && typeof chunks === "object" && !Array.isArray(chunks)) {
    chunks = Object.keys(chunks as Record<string, unknown>)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => (chunks as Record<string, unknown>)[k]);
  }
  if (!Array.isArray(chunks) || chunks.length === 0) return null;

  const coeff = chunks.map((c) => String(c)).join("");
  if (!/^\d+$/.test(coeff)) return null;

  const magnitude = 10 ** (exp - coeff.length + 1);
  const n = sign * Number(coeff) * magnitude;
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

/** Parse số tiền VND từ API hoặc chuỗi có dấu phẩy (chỉ lấy phần nguyên). */
export function parseVndAmount(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").replace(/[^\d]/g, "").trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    if (!Number.isFinite(n)) return null;
    return Math.round(n);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return Math.round(value);
  }
  if (typeof value === "object" && value !== null) {
    const asObj = value as Record<string, unknown>;
    if (typeof asObj.toString === "function") {
      const s = asObj.toString();
      if (s && !s.includes("[object Object]")) {
        const parsed = parseVndAmount(s);
        if (parsed !== null) return parsed;
      }
    }
    return parseBrokenDecimalObject(asObj);
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n);
}

/** Định dạng số với dấu phẩy ngăn cách hàng nghìn: 1000 → 1,000 */
export function formatNumberCommas(
  amount: number | string | null | undefined,
): string {
  const n = parseVndAmount(amount);
  if (n === null) return "";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Định dạng tiền tệ: `1,000 VND`, `10,000 VND`, …
 */
export function formatVND(amount: number | string | null | undefined): string {
  const formatted = formatNumberCommas(amount);
  if (formatted === "") return "—";
  return `${formatted} VND`;
}

/** @deprecated Alias — dùng formatVND */
export const formatVnd = formatVND;

/** Chuỗi chỉ gồm chữ số (tối đa maxDigits) — dùng làm state nội bộ ô nhập tiền. */
export function digitsOnlyInput(raw: string, maxDigits = 13): string {
  return raw.replace(/[^\d]/g, "").slice(0, maxDigits);
}

/** Hiển thị chuỗi chữ số có dấu phẩy trong ô input. */
export function formatDigitsWithCommas(digits: string): string {
  if (!digits) return "";
  return formatNumberCommas(digits);
}

export type FormatSalaryOptions = {
  /** Employer chọn lương thỏa thuận (form để trống hoặc tick thỏa thuận). */
  explicitNegotiable?: boolean;
  /** Tin cũ / chưa nhập — không gán nhầm là thỏa thuận khi có lỗi dữ liệu. */
  missingLabel?: string;
  /** Hậu tố kỳ lương; mặc định theo FULL_TIME = /tháng. */
  periodSuffix?: string;
};

const DEFAULT_SALARY_PERIOD = "/tháng";

function salaryAmountLabel(
  amount: number,
  periodSuffix: string = DEFAULT_SALARY_PERIOD,
): string {
  return `${formatNumberCommas(amount)} VND${periodSuffix}`;
}

/**
 * Hiển thị mức lương tin tuyển dụng (Case A–E trong spec sản phẩm).
 */
export function formatSalaryRange(
  min?: unknown,
  max?: unknown,
  options?: FormatSalaryOptions,
): string {
  if (options?.explicitNegotiable) return "Thỏa thuận";

  const lo = parseVndAmount(min);
  const hi = parseVndAmount(max);
  const period = options?.periodSuffix ?? DEFAULT_SALARY_PERIOD;

  if (lo === null && hi === null) {
    if (options?.missingLabel) return options.missingLabel;
    return "Thỏa thuận";
  }
  if (lo !== null && hi !== null) {
    if (lo === hi) return salaryAmountLabel(lo, period);
    if (lo > hi) {
      return `${salaryAmountLabel(hi, period)} – ${salaryAmountLabel(lo, period)}`;
    }
    return `${salaryAmountLabel(lo, period)} – ${salaryAmountLabel(hi, period)}`;
  }
  if (lo !== null) return `Từ ${salaryAmountLabel(lo, period)}`;
  return `Lên đến ${salaryAmountLabel(hi!, period)}`;
}
