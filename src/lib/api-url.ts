/**
 * Prefixes a root-relative path with the application's configured base path.
 *
 * Next.js rewrites `next/link` and router navigations for `basePath`
 * automatically, but manual `fetch('/api/...')` calls are NOT touched. Routing
 * all client-side requests through this helper keeps them working when the app
 * is served under a sub-path (e.g. `/rezepte` on Uberspace).
 *
 * The base path is exposed to the client via `NEXT_PUBLIC_BASE_PATH`, which is
 * inlined at build time (see `next.config.js`). It is read on every call so the
 * helper stays trivially testable.
 */
export function apiUrl(path: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${basePath}${normalizedPath}`;
}
