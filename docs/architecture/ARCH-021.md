# ARCH-021 — Rate Limit for OCR Uploads

**Status:** draft
**Created:** 2026-07-02
**Traces:** REQ-021
**Verified by:** TEST-021

## Summary

`POST /api/recipes/ocr` triggers a Tesseract OCR run (CPU-heavy, image up to
5 MB) per upload with no throttling, letting a single authenticated user
exhaust the server. This design adds a per-user rate limit reusing the
existing in-memory limiter, so no new infrastructure is introduced.

## Design

### Enforcement point

The limit is applied in the OCR route handler (`src/app/api/recipes/ocr/route.ts`)
directly after authentication and before any expensive work (form parsing,
buffering, Tesseract):

```
authMiddlewareWithRefresh(request)  ->  userId
checkRateLimit(`ocr:user:${userId}`, 10, 10*60*1000)
  not allowed  ->  429 + Retry-After
  allowed      ->  parse file, start OCR (unchanged)
```

Keying on the user id (not the IP) means the limit follows the account and is
unaffected by the `x-forwarded-for` spoofing addressed in the sibling auth
rate-limit fix.

### Reused component

`checkRateLimit(key, maxRequests, windowMs)` from `src/lib/auth/rateLimiter.ts`
— the same fixed-window limiter already used for login/register. It returns
`{ allowed, retryAfterMs }`; the handler maps `retryAfterMs` to the
`Retry-After` header (seconds) exactly as the auth routes do.

Constant in the route: `OCR_RATE_LIMIT = { maxRequests: 10, windowMs: 10 * 60 * 1000 }`.

### Related cleanup

The OCR result cache (`src/lib/ocr/cache.ts`) schedules a cleanup
`setInterval`; it now calls `.unref()` (matching the rate limiter) so the
timer never keeps the Node process alive.

## Key Decisions

- **Reuse the in-memory limiter instead of adding Redis.** The app runs as a
  single instance; a persistent/shared store is out of scope (REQ-021).
- **Key on user id, not IP.** OCR requires authentication, so the account is
  the natural and non-spoofable subject of the limit.
- **Check before parsing the upload**, so a throttled request is rejected
  before any of the expensive work it is meant to prevent.

## Out of Scope

- Shared/persistent rate-limit store for multi-instance deployments.
- Limiting the OCR status endpoint (`GET /api/recipes/ocr/[uploadId]`): it is
  cheap and already ownership-checked.
- Bounding the total size of the in-memory OCR cache (separate concern).

## Open Questions

_None._
