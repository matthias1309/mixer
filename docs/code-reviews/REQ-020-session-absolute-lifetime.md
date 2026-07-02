# Code Review: REQ-020 — Absolute Session Lifetime

**Date**: 2026-07-02
**Reviewer**: Claude Code
**Status**: ✅ APPROVED
**Branch**: `feature/session-absolute-lifetime` (PR #41)

---

## Summary

Caps the sliding-window JWT session at an absolute 24h after the original
login. Addresses finding 3 of the 2026-07-02 security review: because every
authenticated request re-issued a fresh 1h token, nothing bounded the total
session age — a stolen token could be kept alive indefinitely. A new
`authTime` claim records the original login epoch, survives refreshes, and is
enforced in `authMiddlewareWithRefresh`.

**Process**: Full V-Model followed (REQ-020 → ARCH-020 → TEST-020 → tests →
implementation), correctly classified as new user-facing behavior rather than
a bugfix.

**Scope / risk**: Medium. Touches the auth token lifecycle — a **shared seam**
that every authenticated API route funnels through
(`authMiddlewareWithRefresh`). Mitigated by: single enforcement point, a
legacy-token fallback so no one is force-logged-out at deploy, and full suite
(547/547) green.

---

## Files Modified

| File | Change |
|---|---|
| `src/types/auth.ts` | `JWTPayload` gains optional `authTime?: number` (epoch seconds of original login) |
| `src/lib/auth/tokenRefresh.ts` | new private `signToken(userId, email, authTime)`; `generateToken` stamps `authTime = now`; `refreshToken` gains an `authTime` param and preserves it; exports `ABSOLUTE_SESSION_LIFETIME_SECONDS = 24*60*60` |
| `src/lib/auth/middleware.ts` | `authMiddlewareWithRefresh` rejects (returns `null`) when `now - (authTime ?? iat) > 24h`, before refreshing |
| `docs/{requirements,architecture,test-specs}/*-020.md` | V-Model artifacts |
| `CLAUDE.md` | corrected stale "15-min access token + refresh rotation" note |
| `src/__tests__/lib/auth/session-lifetime.test.ts` | new — TC-020-01…05 |

---

## Correctness

- **Absolute cap logic is sound.** `authTime ?? iat` with
  `now - authTime > ABSOLUTE_SESSION_LIFETIME_SECONDS → null` correctly bounds
  a continuously refreshed session; returning `null` reuses the existing
  "unauthenticated" path so no per-route change is needed (AC-020-02).
- **`authTime` preserved across refreshes** — `refreshToken` passes it through
  to `signToken`, so the budget is never extended (AC-020-03). Verified by
  TC-020-03.
- **Legacy fallback** to `iat` for pre-deploy tokens avoids a mass logout and
  still bounds those sessions (TC-020-05).
- **Single caller of the changed `refreshToken` signature** confirmed
  (`middleware.ts` only) — no other call site breaks.
- **Fresh login restarts the budget** because `generateToken` stamps `now`
  (TC-020-04).

## Findings

| # | Severity | Finding |
|---|---|---|
| 1 | Info | The unused non-refresh `authMiddleware` variant does **not** enforce the absolute cap. It currently has zero callers, so there is no live gap — but if it is ever adopted for a protected route, a refreshed token would still pass there for up to its 1h sliding window past the 24h boundary. Documented as out-of-scope in ARCH-020; noted here so a future adopter re-checks. |
| 2 | Info | No server-side revocation — a stolen token remains valid until the 24h cap or its 1h sliding expiry, whichever comes first. Explicitly out of scope per REQ-020; a deny-list would be a separate requirement. |

No blocking issues.

## SOLID / Style

- **SRP**: `signToken` centralizes JWT construction; `generateToken` /
  `refreshToken` now differ only in the `authTime` they supply — no
  duplication.
- **KISS**: cap is a single subtraction/compare at the one chokepoint; no new
  infrastructure (no session table), matching the stateless design.
- Constant named and exported (`ABSOLUTE_SESSION_LIFETIME_SECONDS`) — no magic
  number. Comments explain the *why* (security), not the *how*.

## Tests

- TDD honored: TEST-020 spec + 5 tests written first; 4 red before
  implementation, all green after.
- Behavior-focused with faked timers (`jest.setSystemTime`) — covers within-cap
  success, over-cap rejection of a continuously refreshed token,
  authTime preservation, fresh-login restart, and legacy-token fallback.
- Full suite: 547/547 passed; lint + type-check clean.

## Verdict

✅ **APPROVED** — correct, well-tested, minimal-surface fix for a real
security gap. The two findings are informational and explicitly scoped out in
ARCH-020.
