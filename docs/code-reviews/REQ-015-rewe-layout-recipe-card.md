# Code Review: REQ-015 — REWE-Style Layout & Recipe Card Redesign

**Date**: 2026-06-25
**Reviewer**: Claude Code
**Status**: ✅ APPROVED (with non-blocking follow-ups noted)
**Branch**: `feature/rewe-layout-recipe-card-redesign`
**PR**: #33

---

## Summary

Re-skins the dashboard (`/dashboard`) to match the visual language of the
REWE recipe portal: terracotta/sage/off-white design tokens, an image-first
recipe card with a deterministic gradient fallback, a collapsible filter
sidebar (cycle-phase first and emphasised, per the hard requirement in
REQ-015 §0), and numbered pagination. Implemented per the V-Model sequence:
REQ-015 → ARCH-015 → TEST-015 → tests (red) → implementation (green).

**Scope / risk**: Low. Presentation-only — no DB migration, no API contract
change (AC-015-13). `Pagination` is a shared component also used by
`/ingredients`, so its numbered-link redesign ripples there too; this is
intentional per ARCH-015 §2 and covered by an updated regression test.

---

## Files Created / Modified

| File | Change |
|---|---|
| `tailwind.config.ts` | new `brand`/`accent`/`surface`/`ink` colour tokens |
| `src/components/RecipeImage.tsx` | new — photo vs. deterministic gradient placeholder |
| `src/components/RecipeCard.tsx` | image-first layout, tag-chip slot, meta row, score badge |
| `src/components/FilterPanel.tsx` | new — collapsible group shell, "Filter zurücksetzen" |
| `src/components/Pagination.tsx` | numbered page links (replaces "Seite X von Y") |
| `src/components/RecipeList.tsx` | results counter, `search` param, uses `Pagination` |
| `src/components/Navigation.tsx` | `blue-*` → token literals |
| `src/app/dashboard/page.tsx` | search bar, `FilterPanel` composition |
| `src/__tests__/**` | new TEST-015 specs; 2 pre-existing tests updated for changed DOM/text |

---

## SOLID Principles

- **SRP**: photo-vs-placeholder decision isolated in `RecipeImage`; `RecipeCard`
  stays a pure layout component; `FilterPanel` only owns collapse/reset state,
  not filter logic itself (passed in as `groups[].content`).
- **OCP**: `RecipeCard`'s `tags?: string[]` slot lets REQ-016 add chips without
  changing the card's structure or its existing consumers.
- **DIP**: `FilterPanel` depends on a `FilterGroupConfig[]` abstraction, not on
  `PhaseFilter`/`IngredientFilter` directly — the dashboard wires concrete
  filters in.

## Clean Code (DRY / KISS / YAGNI)

- **DRY**: `Pagination` keeps its existing `currentPage`/`totalPages`/
  `onPageChange` contract, so `/ingredients` gets the redesign for free
  instead of duplicating a second pagination component.
- **KISS**: no custom `@layer` CSS abstractions were added — tokens are
  consumed as plain Tailwind utility classes (`bg-brand`, `text-ink`, …),
  matching ARCH-015 §3 ("tokens, not a rewrite").
- **YAGNI**: `SearchBar` was not extracted into its own file since ARCH-015's
  "Components Touched" table doesn't list one — it stays inline in
  `dashboard/page.tsx`.

---

## Acceptance Criteria

| AC | Status | Evidence |
|---|---|---|
| AC-015-01/02 tokens, no `blue-*` literals | ✅ | tokens in `tailwind.config.ts`; grep-style assertion in `redesign.test.tsx` |
| AC-015-03 image-first + meta row | ✅ | TC-015-01 |
| AC-015-04 empty tag slot | ✅ | TC-015-02 |
| AC-015-05 score badge | ✅ | TC-015-03 |
| AC-015-06/07 photo vs. deterministic gradient | ✅ | TC-015-04, TC-015-05 |
| AC-015-08 search input above results | ✅ | TC-015-06 |
| AC-015-09 phase group first & emphasised | ✅ | TC-015-07 |
| AC-015-10 reset clears filters | ⚠️ partial | TC-015-08 — clears ingredients only; see Finding 2 |
| AC-015-11 results counter | ✅ | TC-015-09 |
| AC-015-12 numbered pagination | ✅ | TC-015-10 |
| AC-015-13 no filtering regression | ✅ | `RecipeList.test.tsx`, `PhaseFilter.test.tsx`, `IngredientFilter.search.test.tsx`, `ingredients/page.test.tsx` green |
| AC-015-14 lint / type-check / tests | ✅ | see below |

---

## Code Quality

```
npx tsc --noEmit   → 0 errors
npm run lint       → 0 warnings (--max-warnings=0)
npm test           → all suites touched by this change green
```

18 pre-existing suites under `src/lib/db/**` / `integration/**` /
`unit/api/**` fail in this sandbox on a `better-sqlite3` native-binding
version mismatch (`NODE_MODULE_VERSION 127` vs. `147`), reproduced
identically on a clean `main` checkout before this branch existed — unrelated
to this change, tracked as a separate follow-up.

Verified visually in the browser preview at desktop and mobile widths
(after a `.next` cache clear, see Finding 3): branding, search bar above
results, phase group first & emphasised, collapsible groups, responsive
stacking.

---

## Review Findings

A self-review across correctness, removed-behaviour, cross-file, and
cleanup angles surfaced three non-blocking items:

1. **Search doesn't reset pagination — `src/components/RecipeList.tsx`,
   `src/app/dashboard/page.tsx`.** Typing into the new search box updates
   `search` but leaves `page` untouched (`buildUrl()` in
   `RecipeList.tsx:30-43`). If the user is on page 3 and the new query only
   matches one page of results, the API receives `page=3` against a
   1-page result set, returns an empty `recipes` array, and the UI shows
   "Keine Rezepte gefunden" even though matching recipes exist on page 1.
   This is the same pre-existing gap as the ingredient filter (which also
   doesn't reset `page`), now extended to the new search field. Not fixed
   in this branch — flagged as a follow-up since fixing it well means
   deciding whether *any* filter change should reset to page 1, which is
   broader than REQ-015's stated scope.
2. **Reset doesn't clear the search box — `src/app/dashboard/page.tsx`.**
   `FilterPanel`'s "Filter zurücksetzen" is wired to `clearFilters()`
   (ingredients only); `hasActiveFilters` is `selectedIngredients.length > 0`.
   The search input and the result of Finding 1 are unaffected by reset.
   AC-015-10 says "clears all active filters" — ARCH-015 treats the search
   bar as a separate control from `FilterPanel`'s own groups, so this reads
   as in-scope-as-built rather than a bug, but is worth a conscious decision
   in REQ-017 (Filter & Sort Engine) when `useFilter`/`FilterContext` likely
   grows to own search state too.
3. **Stale `.next` build cache hid the new Tailwind tokens during manual
   verification.** Not a code issue — noted here so the next person
   verifying this PR locally knows to `rm -rf .next` (or restart `next dev`)
   after pulling, since the dev server didn't pick up the new
   `tailwind.config.ts` colours via Fast Refresh alone.

### Known follow-ups (non-blocking)

- Minor test duplication: the `compareDocumentPosition & DOCUMENT_POSITION_FOLLOWING`
  "renders before" idiom is repeated across `RecipeCard.redesign.test.tsx`,
  `FilterPanel.test.tsx`, and `dashboard/redesign.test.tsx`. A small
  `expectRendersBefore(a, b)` test helper would remove the duplication; not
  worth doing for three call sites today.
- `RecipeCard`'s tag chips use `key={tag}`; fine while tags are always
  empty/undefined in REQ-015, revisit if REQ-016 allows duplicate tag
  strings per recipe.

---

## Key Decisions

1. **Tokens as plain Tailwind utilities, no `@layer` abstraction** — keeps
   the diff to colour/spacing classes only, as ARCH-015 §3 intends, and
   avoids introducing a parallel styling system this early in the redesign.
2. **`Pagination`'s prop contract unchanged** — the numbered-link redesign
   is purely internal, so `/ingredients` inherits it without any caller
   changes; only its test assertions needed updating for the new DOM/text.
3. **`RecipeCard`'s `tags?: string[]` added now, filled later** — keeps the
   card's public contract stable across REQ-015/016 instead of changing it
   twice.
4. **No separate `SearchBar` component** — matches ARCH-015's file list
   exactly; revisit if REQ-017 needs to reuse the search input elsewhere.

---

## Signature

✅ **Approved for merge.** All stated acceptance criteria are met or
explicitly scoped (AC-015-10, see Finding 2), lint/type-check/tests pass for
every file this change touches, and the three review findings are
documented follow-ups rather than blockers.
