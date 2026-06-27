function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, '');
}

export const SERVER_URL = stripTrailingSlash(process.env.NEXT_PUBLIC_SERVER_URL || 'http://127.0.0.1:8000');

/**
 * Public backend origin for browser → API calls in production.
 * Required on Vercel: the Next.js /api proxy is capped at ~10s and causes 502/timeouts.
 * Set in Vercel env: NEXT_PUBLIC_API_ORIGIN=https://api.viewpro.com
 */
export const PUBLIC_API_ORIGIN = (() => {
  const explicit = process.env.NEXT_PUBLIC_API_ORIGIN?.trim();
  if (explicit) return stripTrailingSlash(explicit);
  if (process.env.NEXT_PUBLIC_USE_DIRECT_API === 'true') return SERVER_URL;
  return null;
})();

export const USE_DIRECT_BROWSER_API = Boolean(
  PUBLIC_API_ORIGIN && PUBLIC_API_ORIGIN.startsWith('https://'),
);

/** Browser API base — direct to backend in production, same-origin proxy in local dev. */
export const BASE_URL = USE_DIRECT_BROWSER_API ? `${PUBLIC_API_ORIGIN}/api` : '/api';

/** SSE — must bypass Vercel proxy in production (long-lived stream). */
export const SSE_URL = USE_DIRECT_BROWSER_API ? `${PUBLIC_API_ORIGIN}/api/sse` : '/api/sse';

export const AVATAR_URL = USE_DIRECT_BROWSER_API
  ? `${PUBLIC_API_ORIGIN}/public/avatars/`
  : '/viewpro/public/avatars/';

/** Server-side proxy target (Next.js route handler, SSR). */
export const INTERNAL_API_ORIGIN = stripTrailingSlash(
  process.env.INTERNAL_API_ORIGIN || SERVER_URL,
);

export function buildViewProWidgetUrl(): string {
  if (process.env.NEXT_PUBLIC_VIEWPRO_WIDGET_URL) {
    return process.env.NEXT_PUBLIC_VIEWPRO_WIDGET_URL;
  }

  if (USE_DIRECT_BROWSER_API && PUBLIC_API_ORIGIN) {
    const apiBase = encodeURIComponent(`${PUBLIC_API_ORIGIN}/api`);
    const avatarBase = encodeURIComponent(`${PUBLIC_API_ORIGIN}/public/avatars/`);
    return `/viewpro-widget.js?isVisible=false&apiBase=${apiBase}&avatarBase=${avatarBase}`;
  }

  return '/viewpro-widget.js?isVisible=false&apiBase=/api&avatarBase=/viewpro/public/avatars/';
}
