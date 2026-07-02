# ARCH-020 — Absolute Session Lifetime for Sliding-Window JWT

**Status:** draft
**Created:** 2026-07-02
**Traces:** REQ-020
**Verified by:** TEST-020

## Summary

The session JWT is refreshed on every authenticated request (1h sliding
window). Because each refresh mints a brand-new token, nothing bounds the
total session age — a stolen token can be kept alive forever. This design
adds an absolute cap: the token carries the original login time in a new
`authTime` claim, refreshes preserve it, and the auth middleware rejects
tokens whose login is older than 24 hours.

## Design

### Token payload

`JWTPayload` (`src/types/auth.ts`) gains one claim:

```typescript
interface JWTPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
  type: 'access';
  authTime: number; // epoch seconds of the original login (survives refreshes)
}
```

### Token lifecycle (`src/lib/auth/tokenRefresh.ts`)

```
login/register ──> generateToken(userId, email)
                     authTime = now                      (fresh 24h budget)

any auth request ─> refreshToken(userId, email, authTime)
                     authTime = caller-supplied value    (budget unchanged)
```

- `generateToken` sets `authTime` to the current epoch seconds.
- `refreshToken` gains an `authTime` parameter and passes it through, so the
  claim survives arbitrarily many refreshes (AC-020-03).
- New constant `ABSOLUTE_SESSION_LIFETIME_SECONDS = 24 * 60 * 60`; the 1h
  sliding `TOKEN_EXPIRY` stays as is.

### Enforcement (`src/lib/auth/middleware.ts`)

`authMiddlewareWithRefresh` — the single chokepoint every API route uses —
adds one check after signature verification:

```
sessionAge = now - (payload.authTime ?? payload.iat)
sessionAge > ABSOLUTE_SESSION_LIFETIME_SECONDS  ->  return null (no refresh)
```

Returning `null` makes every caller behave exactly as for a missing/invalid
token (401 on protected routes, anonymous on public routes) — no per-route
changes needed (AC-020-02). Otherwise the middleware issues the refreshed
token with the preserved `authTime` (AC-020-01).

### Backwards compatibility

Tokens minted before this change carry no `authTime`; the middleware falls
back to the token's own `iat`. In-flight sessions therefore age out within
their normal sliding window instead of being invalidated at deploy.

### Documentation

`CLAUDE.md` currently documents "15-min access token + refresh rotation",
which never matched the implementation. It is corrected to
"1h sliding-window JWT with 24h absolute lifetime".

## Key Decisions

- **Claim in the token instead of server-side session state.** A DB-backed
  session table would enable revocation but adds a write per request and a
  new shared seam; out of scope per REQ-020. The claim is tamper-proof (it
  is inside the signed JWT) and keeps the stateless design.
- **Enforce in `authMiddlewareWithRefresh`, not per route.** All routes
  already funnel through it; `null` already means "not authenticated".
- **Fallback to `iat` for legacy tokens** instead of rejecting them: avoids
  logging every user out on deploy while still bounding legacy sessions.

## Out of Scope

- Server-side revocation / deny list (noted as follow-up in REQ-020).
- Changing the 1h sliding expiry or the cookie attributes.
- `authMiddleware` (header-based variant): it never refreshes tokens, so the
  sliding-window loophole does not exist there; expired tokens already fail
  signature verification after 1h.

## Open Questions

_None._
