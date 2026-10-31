import { Prisma } from '@prisma/client';

/** Bỏ dấu tiếng Việt để hỗ trợ tìm không dấu (mức độ thực tế trên MySQL contains). */
export function foldSearchAscii(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
}

export function tokenizeJobKeyword(keyword: string): string[] {
  const trimmed = keyword.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/).filter((t) => t.length > 0);
}

function searchVariants(token: string): string[] {
  const raw = token.trim();
  if (!raw) return [];
  const folded = foldSearchAscii(raw);
  const lower = raw.toLowerCase();
  const set = new Set<string>([raw, lower, folded, folded.toLowerCase()]);
  return [...set].filter(Boolean);
}

/** Một token khớp ít nhất một trường tìm kiếm. */
function tokenMatchesFields(token: string): Prisma.JobWhereInput {
  const variants = searchVariants(token);
  const fieldOr: Prisma.JobWhereInput[] = [];

  for (const v of variants) {
    fieldOr.push(
      { title: { contains: v } },
      { description: { contains: v } },
      { requirements: { contains: v } },
      { benefits: { contains: v } },
      { location: { contains: v } },
      { experienceLevel: { contains: v } },
      { company: { companyName: { contains: v } } },
      { category: { categoryName: { contains: v } } },
    );
  }

  return { OR: fieldOr };
}

/**
 * Lọc từ khóa: mọi token phải khớp (AND), mỗi token khớp ít nhất một trường (OR).
 */
export function buildPublicJobKeywordWhere(
  keyword: string | undefined,
): Prisma.JobWhereInput | null {
  const tokens = tokenizeJobKeyword(keyword ?? '');
  if (tokens.length === 0) return null;

  if (tokens.length === 1) {
    return tokenMatchesFields(tokens[0]!);
  }

  return {
    AND: tokens.map((t) => tokenMatchesFields(t)),
  };
}
