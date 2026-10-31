import * as crypto from 'crypto';

/** Mã hoá giá trị tham số đúng spec VNPAY (khoảng trắng → +, không encode key). */
export function encodeVnpValue(value: string): string {
  return encodeURIComponent(String(value)).replace(/%20/g, '+');
}

export function sortVnpParams(
  params: Record<string, string | number | undefined | null>,
): Record<string, string> {
  const sorted: Record<string, string> = {};
  Object.keys(params)
    .sort()
    .forEach((key) => {
      const val = params[key];
      if (val === undefined || val === null || val === '') return;
      sorted[key] = String(val);
    });
  return sorted;
}

/** Chuỗi ký canonical: key1=encodedVal1&key2=encodedVal2 (key sort A→Z). */
export function buildVnpSignData(params: Record<string, string>): string {
  return Object.keys(params)
    .sort()
    .map((key) => `${key}=${encodeVnpValue(params[key])}`)
    .join('&');
}

export function signVnpParams(
  params: Record<string, string>,
  hashSecret: string,
): string {
  const signData = buildVnpSignData(params);
  return crypto
    .createHmac('sha512', hashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');
}

export function verifyVnpSignature(
  params: Record<string, string>,
  secureHash: string,
  hashSecret: string,
): boolean {
  const clone = { ...params };
  delete clone['vnp_SecureHash'];
  delete clone['vnp_SecureHashType'];
  const signed = signVnpParams(sortVnpParams(clone), hashSecret);
  return signed === secureHash;
}

const VNPAY_GATEWAY_HOSTS = ['sandbox.vnpayment.vn', 'vnpayment.vn'];

/**
 * URL redirect VNPAY: query string = chuỗi ký + &vnp_SecureHash=...
 * (cùng encoding với chuỗi HMAC — tránh sai chữ ký code 70).
 */
export function buildVnpayPaymentUrl(
  baseUrl: string,
  params: Record<string, string | number>,
  hashSecret: string,
): string {
  const sorted = sortVnpParams(params);
  const signData = buildVnpSignData(sorted);
  const secureHash = signVnpParams(sorted, hashSecret);
  return `${baseUrl}?${signData}&vnp_SecureHash=${secureHash}`;
}

export function isAllowedVnpayGatewayUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return VNPAY_GATEWAY_HOSTS.some(
      (h) => u.hostname === h || u.hostname.endsWith(`.${h}`),
    );
  } catch {
    return false;
  }
}

/** vnp_CreateDate / vnp_ExpireDate theo giờ VN (yyyyMMddHHmmss). */
export function formatVnpCreateDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? '00';
  return `${get('year')}${get('month')}${get('day')}${get('hour')}${get('minute')}${get('second')}`;
}

export function vnpCreateAndExpireDates(
  now = new Date(),
  expireMinutes = 15,
): { createDate: string; expireDate: string } {
  const createDate = formatVnpCreateDate(now);
  const expireDate = formatVnpCreateDate(
    new Date(now.getTime() + expireMinutes * 60 * 1000),
  );
  return { createDate, expireDate };
}

/** VNPAY sandbox yêu cầu IPv4. */
export function normalizeVnpIpAddr(ip?: string | null): string {
  if (!ip?.trim()) return '127.0.0.1';
  const first = ip.split(',')[0]?.trim() ?? '';
  if (
    first === '::1' ||
    first === '::ffff:127.0.0.1' ||
    first.startsWith('::ffff:')
  ) {
    return '127.0.0.1';
  }
  if (first.includes(':') && !first.includes('.')) {
    return '127.0.0.1';
  }
  return first;
}

export function isPublicHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return false;
    const h = u.hostname.toLowerCase();
    if (h === 'localhost' || h.endsWith('.local')) return false;
    if (h.startsWith('127.') || h.startsWith('192.168.') || h.startsWith('10.')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
