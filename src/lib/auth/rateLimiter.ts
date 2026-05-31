interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 10 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of store.entries()) {
        if (now > entry.resetAt) store.delete(key);
      }
    },
    10 * 60 * 1000
  ).unref();
}

/** Clears all rate limit state. Only for use in tests. */
export function clearRateLimitStore(): void {
  store.clear();
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}
