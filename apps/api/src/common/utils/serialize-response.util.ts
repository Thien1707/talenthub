import { Prisma } from '@prisma/client';

/**
 * Chuẩn hóa dữ liệu trả về JSON: BigInt → string, Decimal → string, Date → ISO.
 * Prisma Decimal phải gọi toString() — nếu duyệt object generic sẽ thành { s, e, d } và frontend không đọc được lương.
 */
export function serializeForJson(value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Prisma.Decimal.isDecimal(value)) return value.toString();
  if (Array.isArray(value)) return value.map(serializeForJson);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, serializeForJson(v)]),
    );
  }
  return value;
}
