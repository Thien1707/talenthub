import type { ConfigService } from '@nestjs/config';

/** Chuẩn hóa origin (bỏ slash cuối). */
function normOrigin(url: string): string {
  return url.trim().replace(/\/$/, '');
}

/**
 * CORS: WEB_URL + CORS_ORIGINS (phân tách bằng dấu phẩy).
 * CORS_ALLOW_VERCEL=true → cho phép mọi origin *.vercel.app (preview deploy).
 */
export function buildCorsOriginOption(
  config: ConfigService,
): boolean | string | string[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void) {
  const allowVercel =
    String(config.get<string>('CORS_ALLOW_VERCEL') ?? '').toLowerCase() ===
    'true';

  const set = new Set<string>();
  const web = config.get<string>('WEB_URL');
  if (web) set.add(normOrigin(web));

  const extra = config.get<string>('CORS_ORIGINS');
  if (extra) {
    for (const part of extra.split(',')) {
      const o = normOrigin(part);
      if (o) set.add(o);
    }
  }

  const list = [...set];

  if (allowVercel) {
    return (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const o = normOrigin(origin);
      if (list.includes(o) || o.endsWith('.vercel.app')) {
        callback(null, true);
        return;
      }
      callback(null, false);
    };
  }

  if (list.length === 0) return true;
  if (list.length === 1) return list[0];
  return list;
}
