# Code Review: REQ-019 — Configurable Recipe Page Size

**Date**: 2026-06-26
**Reviewer**: Claude Code
**Status**: ✅ APPROVED
**Branch**: `feature/recipe-page-size` (PR #37)

---

## Summary

Adds a page-size dropdown (10/20/50/100) next to the existing sort control on
the dashboard, letting the user choose how many recipes load per page
instead of the fixed value of 10. The change is almost entirely UI wiring —
`GET /api/recipes` already accepted and clamped a `pageSize` query parameter
(REQ-015) — but writing the retroactive tests for that existing parameter
surfaced and fixed a real bug: a non-numeric `pageSize` produced `NaN` and a
500 instead of falling back to the documented default of 10.

**Process note**: this story was *not* run through the V-Model in the
prescribed order. Implementation happened first (small UI tweak), and
REQ-019 → ARCH-019 → TEST-019 were written retroactively only after the user
asked why the sequence was skipped. Documented as a process learning in
`.claude/rules/learnings.md` (2026-06-26 entry) — future "small" requests
should get an explicit V-Model-skip confirmation before code is written, not
after.

**Scope / risk**: Low. No schema change, no new API surface — only the
existing `pageSize` parameter is now reachable from the UI, plus a NaN-safety
fix on `page`/`pageSize` parsing in a **shared seam**
(`src/app/api/recipes/route.ts`, used by Recipe CRUD, Scoring/011,
Filtering/017, Ratings/018). Full suite (542/542) passes after the change.

---

## Files Created / Modified

| File | Change |
|---|---|
| `src/components/PageSizeDropdown.tsx` | new — controlled `<select>` with fixed options 10/20/50/100, structurally identical to `SortDropdown` |
| `src/components/RecipeList.tsx` | accepts `pageSize` prop (default 10); included in `buildUrl()`/fetch dependency array; new `useEffect` resets `page` to `1` whenever `pageSize` changes |
| `src/app/dashboard/page.tsx` | owns `pageSize` state, renders `PageSizeDropdown` next to `SortDropdown`, passes `pageSize` into `RecipeList` |
| `src/app/api/recipes/route.ts` | **bug fix** — `page`/`pageSize` parsing now checks `Number.isNaN(...)` before falling back to the default, instead of relying on `parseInt(...) \|\| default`, which only catches falsy input, not `NaN` from non-numeric strings |
| `src/__tests__/components/PageSizeDropdown.test.tsx` | new — renders fixed options with current value selected; emits selected value as a `number` |
| `src/__tests__/components/RecipeList.test.tsx` | two new cases — `pageSize` is included in the fetch URL; changing `pageSize` resets to page 1 |
| `src/__tests__/unit/api/recipes/crud.test.ts` | three new cases — `pageSize` clamped above 100, invalid `pageSize` falls back to 10 (the bug fix's regression test), `totalPages` computed from the requested `pageSize` |
| `docs/requirements/REQ-019.md`, `docs/architecture/ARCH-019.md`, `docs/test-specs/TEST-019.md` | new — written retroactively, traced from REQ-015 |
| `.claude/rules/learnings.md` | process learning entry (see Summary) |

---

## SOLID Principles

- **SRP**: `PageSizeDropdown` only renders/emits a value — no fetch or
  state-reset logic, which stays in `RecipeList` (mirrors `SortDropdown`'s
  split).
- **OCP**: `RecipeList`'s `pageSize` prop is additive with a default (`= 10`),
  so existing callers that don't pass it are unaffected.
- **DIP**: `RecipeList` doesn't know about clamping rules — it just forwards
  the raw number; the API route owns the only clamping logic, unchanged in
  shape, just hardened against `NaN`.

## DRY

- `PageSizeDropdown` reuses the exact `value`/`onChange` controlled-select
  pattern already established by `SortDropdown` instead of inventing a new
  shape.
- The `page` and `pageSize` parsing in `route.ts` were fixed with the same
  `Number.isNaN(...) ? default : parsed` pattern applied symmetrically to
  both variables, rather than only patching the one the test caught.

## Correctness

- **NaN bug (found via testing, not by inspection)**: `parseInt('not-a-number' || '10', 10)`
  evaluates to `NaN` because the `||` fallback only triggers on a falsy
  *string* (`null`/`''`), not on a numeric parse failure. `Math.max(1, NaN)`
  and `Math.min(100, NaN)` are both `NaN`, which propagated into the SQL
  `LIMIT`/`OFFSET` and caused a 500. Fixed by parsing first, then checking
  `Number.isNaN(...)` explicitly before clamping — verified by
  `falls back to the default pageSize of 10 for invalid input` in
  `crud.test.ts`, which failed with a 500 before the fix and now asserts 200
  + `pageSize: 10`.
- **Page-reset-on-pageSize-change** (AC-019-03) is implemented as its own
  `useEffect` keyed only on `pageSize`, independent of the existing
  `buildUrl`/fetch effect — avoids requesting an out-of-range page (e.g. user
  on page 5 of size 10, switches to size 100, only 1 page of results exists).
  Verified by `resets to page 1 when pageSize changes` in
  `RecipeList.test.tsx`.
- **Existing clamping behaviour preserved**: `pageSize` is still clamped to
  `[1, 100]` server-side regardless of what the UI offers, so a manually
  crafted request (e.g. `pageSize=99999`) can't request an unbounded page —
  verified by the pre-existing `respect pagination limits` test plus the new
  `clamps pageSize above 100 to 100` case.

## Testing

- TDD was **not** followed in the prescribed red-then-green order — code was
  written first, tests added retroactively. The tests are real, not
  placeholder stubs, and one of them (`crud.test.ts`'s invalid-`pageSize`
  case) caught a genuine bug before merge, which is the outcome TDD is meant
  to produce, just arrived at out of sequence. This is the gap flagged in the
  Summary's process note.
- Unit: `PageSizeDropdown.test.tsx` (renders options, emits numeric value).
- Unit: `RecipeList.test.tsx` (pageSize reaches the fetch URL; page resets to
  1 on pageSize change — the second case required relaxing the fetch mock
  from `mockResolvedValueOnce` to `mockResolvedValue` because the component's
  own page-sync effect (`setPage(data.page)`) triggers an extra fetch when
  the mocked response's `page` differs from local state; this is documented
  in TEST-019 §TC-019-04 notes).
- Integration: `crud.test.ts` (clamp above 100, invalid input falls back to
  10, `totalPages` derived from the requested `pageSize`).
- Full suite: 542/542 passing. `npm run lint` and `npx tsc --noEmit` both
  clean.

## Findings — none blocking

- `src/components/RecipeList.tsx` — the `pageSize`-change `useEffect` and the
  fetch-triggering effect are independent, which can produce one extra,
  immediately-superseded fetch when `pageSize` changes while not on page 1
  (the server-returned `page` from the stale request briefly disagrees with
  the just-reset local `page` before the corrected request lands). Outcome is
  correct; worth a short comment if this surprises a future reader, no
  functional change needed.
- `docs/test-specs/TEST-019.md` TC-019-08 documents the quality-gate check
  (lint/typecheck/test) as a pseudo test case for AC-019-07 coverage rather
  than a dedicated test — consistent with how other retroactive TEST-SPECs in
  this repo (e.g. TEST-011) treat the "quality gates" AC.

## Out of Scope (confirmed, not implemented)

- Persisting the selected page size across sessions or per user, per
  REQ-019 §6.
- Page sizes outside the fixed 10/20/50/100 set, per REQ-019 §6.
- Any change to the `/api/recipes` route's clamping *range* — only its
  `NaN`-safety was fixed; the `[1, 100]` bounds from REQ-015 are unchanged.
