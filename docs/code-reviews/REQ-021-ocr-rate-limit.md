# Code Review: REQ-021 — Rate Limit for OCR Uploads

**Date**: 2026-07-02
**Reviewer**: Claude Code
**Status**: ✅ APPROVED
**Branch**: `fix/ocr-rate-limit` (PR #40)

---

## Summary

Adds a per-user rate limit (10 uploads / 10 minutes) to `POST
/api/recipes/ocr`, which runs a CPU-heavy Tesseract OCR job per request with
no prior throttling — finding 4 of the 2026-07-02 security review. Reuses the
existing in-memory fixed-window limiter (`checkRateLimit`) already used for
login/register, keyed on user id rather than IP so it can't be bypassed via
`X-Forwarded-For` spoofing. Also unrefs the OCR cache's cleanup interval so
it never keeps the Node process alive.

**Process**: Full V-Model followed (REQ-021 → ARCH-021 → TEST-021 → tests →
implementation). REQ-021 is explicitly noted as written after the fix (the
same retrofit pattern used for REQ-020/PR #41), which is consistent with the
2026-06-26 learning about not skipping the V-Model for new user-facing
behavior — the 429 response is such behavior.

**Scope / risk**: Low. Single route, single new call to an already-proven
limiter; no shared seam beyond the limiter itself, which is additive
(new key namespace `ocr:user:*`, no collision with `login:*` / `register:*`).

---

## Files Modified

| File | Change |
|---|---|
| `src/app/api/recipes/ocr/route.ts` | Rate-limit check added right after auth, before form parsing/buffering/Tesseract; 429 + `Retry-After` on rejection |
| `src/lib/ocr/cache.ts` | Cleanup `setInterval` now `.unref()`'d |
| `docs/{requirements,architecture,test-specs}/*-021.md` | V-Model artifacts |
| `src/__tests__/unit/api/recipes/ocr-rate-limit.test.ts` | new — TC-021-01, TC-021-02 |

---

## Correctness

- **Enforcement point is correct.** The check runs immediately after
  `authMiddlewareWithRefresh` and before `request.formData()` / buffering /
  `extractTextFromImage`, so a throttled request is rejected before any of
  the expensive work it exists to prevent (AC-021-01/02).
- **Keyed on user id, not IP** — consistent with ARCH-021's rationale and
  unaffected by the XFF-spoofing issue fixed in the sibling PR (#39).
- **429 response shape matches the existing convention**: `Retry-After` in
  seconds via `Math.ceil(retryAfterMs / 1000)`, same as
  `login`/`register` routes.
- **Per-user isolation verified** by TC-021-02: a second user's upload
  succeeds while the first is throttled — confirms no shared/global key.
- **`checkRateLimit` itself is unit-agnostic reuse**, not a new
  implementation — no new bug surface in the limiter logic.

## Findings

| # | Severity | Finding |
|---|---|---|
| 1 | Info | The limit is in-memory and per-instance (explicitly out of scope in ARCH-021). If the app is ever run with more than one Node instance, a user could get up to `N × 10` uploads per window. No live gap today — single-instance deployment per CLAUDE.md. |
| 2 | Info | `GET /api/recipes/ocr/[uploadId]` (status polling) is intentionally not rate-limited, per ARCH-021 ("cheap and already ownership-checked"). Confirmed by reading the route — reasonable, not a gap. |

No blocking issues.

## SOLID / Style

- **DRY**: reuses `checkRateLimit` rather than a bespoke OCR limiter —
  matches the existing login/register pattern exactly.
- **KISS**: one guard clause, one constant (`OCR_RATE_LIMIT`), no new
  infrastructure.
- Comment on the constant explains *why* (CPU cost, security review), not
  *how* — consistent with project comment conventions.

## Tests

- TDD honored: TEST-021 spec + 2 tests written first, covering AC-021-01
  through AC-021-03 (limit accepted/rejected + per-user isolation).
  Tesseract is mocked so only routing/limiting behavior is under test.
- Verified locally on `fix/ocr-rate-limit`: full suite 544/544 passed,
  `npm run lint` clean, `npx tsc --noEmit` clean.

## Verdict

✅ **APPROVED** — minimal, correctly-placed fix for a real DoS vector, reuses
a proven component, fully tested. Findings are informational and already
scoped out in ARCH-021.
