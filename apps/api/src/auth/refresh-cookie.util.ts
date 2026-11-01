import type { CookieOptions } from 'express';

const REFRESH_COOKIE = 'talenthub_refresh';

export { REFRESH_COOKIE };

/**
 * Frontend Vercel + API Render = cross-site. Cookie refresh cần SameSite=None + Secure
 * thì axios/fetch (credentials) mới gửi được cookie lên onrender.com.
 */
export function refreshCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === 'production';
  const webUrl = process.env.WEB_URL?.trim();
  let crossSite = isProd;
  if (webUrl) {
    try {
      const webHost = new URL(webUrl).host;
      crossSite =
        isProd &&
        !webHost.includes('localhost') &&
        !webHost.includes('127.0.0.1');
    } catch {
      crossSite = isProd;
    }
  }

  const sameSite = crossSite ? ('none' as const) : ('lax' as const);
  return {
    httpOnly: true,
    secure: crossSite || isProd,
    sameSite,
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
