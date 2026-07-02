import { NextRequest } from 'next/server';

/**
 * Resolve the client IP for rate limiting from x-forwarded-for.
 *
 * Proxies append the IP they received the connection from, so only the LAST
 * entry is set by our own reverse proxy and trustworthy; earlier entries are
 * client-controlled and spoofable. Assumes exactly one trusted proxy in front
 * of the app (Uberspace setup, see docs/deployment/uberspace-setup.md).
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (!forwardedFor) {
    return 'unknown';
  }

  const entries = forwardedFor
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');

  return entries.length > 0 ? entries[entries.length - 1] : 'unknown';
}
