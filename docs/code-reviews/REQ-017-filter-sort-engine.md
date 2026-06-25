# Code Review: REQ-017 — REWE-Style Filter & Sort Engine

**Date**: 2026-06-25
**Reviewer**: Claude Code
**Status**: ✅ APPROVED
**Branch**: working tree (not yet branched/committed)

---

## Summary

Wires the REQ-016 metadata into `GET /api/recipes` and the sidebar:
`difficulty`, `maxTime`, `mealType`, `tags` (AND-combined), and an extended
`sort` (`newest`/`time`/`rating`, the last falling back to default ordering
until REQ-018 lands). All filters compose with the existing `phase` and
`ingredients` filters in a single paginated query. Implemented per the
V-Model sequence: REQ-017 → ARCH-017 → TEST-017 → tests (red) →
implementation (green).

**Scope / risk**: Low-medium. No schema change. Extends two **shared
seams** flagged in the feature map: `recipe-async.ts`/`recipe.ts` (also used
by Scoring/Nutrition/Photo/Filtering) and
`src/app/api/recipes/route.ts` (list) (also used by Recipe CRUD, Scoring,
search/sort, and — going forward — Ratings/018). All full-suite tests
(518/518) pass after the change, so the shared-seam blast radius is covered.

**Environment note**: `better-sqlite3`'s native binding was compiled
against the system's active Node (26) rather than the project's pinned
`.nvmrc` (22), so `npm test` failed with a `NODE_MODULE_VERSION` mismatch
before any code in this change ran. Fixed by running under `nvm use 22`
(`npm rebuild better-sqlite3`); unrelated to this change but blocked
verification until resolved — same issue noted in the REQ-016 review.

---

## Files Created / Modified

| File | Change |
|---|---|
| `src/lib/db/build-recipe-query.ts` | new — `buildRecipeQuery()`: parameterised predicates for difficulty/maxTime/mealType/tags (AND via `HAVING COUNT`), unknown values dropped, `ORDER BY` for all sort options |
| `src/lib/constants.ts` | `RECIPE_SORT_OPTIONS` extended with `newest`/`time`/`rating` |
| `src/lib/db/models/recipe-async.ts` | `listAllWithScoreAsync` composes `buildRecipeQuery()` predicates/order-by into its WHERE/ORDER BY; dropped the dead `selectedIngredients` param in favour of `filters` |
| `src/lib/db/models/recipe.ts` | `filterByIngredientsWithScore(Async)` gains the same `filters` param and now honours `sort` (was hardcoded to `created_at DESC`) |
| `src/app/api/recipes/route.ts` | parses `difficulty`/`maxTime`/`mealType`/`tags` and passes them to both list paths; no extra validation needed (handled by `buildRecipeQuery`) |
| `src/contexts/FilterContext.tsx`, `src/hooks/useFilter.ts` | extended with `selectedTags`/`difficulty`/`maxTime` state; `clearFilters` resets all of it |
| `src/components/recipe/TagGroupFilter.tsx` | new — generic checkbox group reused for Ernährung/Hauptzutat/Ernährungsform/Backen/Anlässe |
| `src/components/recipe/DifficultyFilter.tsx` | new — Aufwand radio group |
| `src/components/recipe/MaxTimeFilter.tsx` | new — max-time select |
| `src/components/SortDropdown.tsx` | new — sort select |
| `src/app/dashboard/page.tsx` | composes the new `FilterPanel` groups (phase first, as required) and the sort dropdown |
| `src/components/RecipeList.tsx` | builds `sort`/`difficulty`/`maxTime`/`tags` query params |
| `src/__tests__/**` | `build-recipe-query.test.ts` (unit), `filter-engine.test.ts` (integration), `FilterPanel.groups.test.tsx`, `SortDropdown.test.tsx`; 4 existing `useFilter` mocks extended with the new fields |

---

## SOLID Principles

- **SRP**: predicate/order-by construction lives only in
  `build-recipe-query.ts`; both model classes call it rather than
  re-implementing filter logic, removing the duplicate `sortByMap` that used
  to live in `recipe-async.ts`.
- **OCP**: `RecipeQueryFilters` is additive — `RecipeModel`/`RecipeModelAsync`
  callers that don't pass it keep their old behaviour (`filters = {}`
  default), confirmed by the pre-existing 35-case `recipe.test.ts` and the
  `image.test.ts` 5-arg call site staying green untouched.
- **DIP**: `route.ts` depends on `RecipeQueryFilters`/`buildRecipeQuery` as
  an abstraction; it performs no vocabulary-specific validation itself,
  mirroring how it already delegates to `validateRecipeMetadataFields()`.

## DRY

- `buildRecipeQuery()` is the single place that knows the SQL shape for
  every filter and sort option; the previous per-method `sortByMap` literals
  in `recipe-async.ts` and the hardcoded `ORDER BY recipes.created_at DESC`
  in `recipe.ts` were removed in favour of it.
- `TagGroupFilter` is one component parameterised by `tags`, reused for all
  five REWE tag groups instead of five near-identical components.

## Correctness

- All predicates are bound parameters (`?`), never string-interpolated —
  verified by a dedicated unit test (`binds all user values as parameters
  instead of inlining them`) and SQLite-only project policy (no PostgreSQL
  path to dual-test against, per ADR-008).
- Tag AND-matching uses `HAVING COUNT(DISTINCT tag) = ?` against the
  filtered (known-only) tag count, so an unknown tag mixed into the list
  doesn't make matching impossible — `tags=Vegan,Glutenhaltig` behaves like
  `tags=Vegan`, per AC-017-04's "ignored, not erroring" intent.
- `maxTime` predicate explicitly requires `total_time_minutes IS NOT NULL`,
  so recipes without a time are correctly excluded rather than matching
  `NULL <= maxTime` (which SQLite would evaluate as unknown/false anyway,
  but the explicit `IS NOT NULL` makes the intent unambiguous at the SQL
  text level).
- `sort=time` uses `total_time_minutes IS NULL, total_time_minutes ASC` to
  put recipes without a time last instead of first.
- `phase` was already score-only (not a SQL filter) in both list paths, so
  AC-017-03 ("composes with phase") required no change there — confirmed by
  the new `applies phase, ingredients, and metadata filters together`
  integration test.

## Testing

- TDD followed: all TEST-017 cases written and confirmed red (missing
  module / unmet filter) before implementation, then green.
- Unit (`build-recipe-query.test.ts`): 14 cases covering each filter in
  isolation, AND-tags, unknown-value dropping, parameter binding, and all
  three sort branches.
- Integration (`filter-engine.test.ts`, real in-memory SQLite via the actual
  `GET` handler): difficulty/maxTime/mealType/tag filtering, AND-tags,
  phase+ingredients+metadata composition, and the "unknown value → 200, not
  500" case from AC-017-04.
- Component: `FilterPanel.groups.test.tsx` renders all seven new/existing
  groups, asserts phase stays first, and exercises selection + reset through
  the real `FilterContext` (not a shallow mock) so `clearFilters` is proven
  to clear the new state, not just assumed. `SortDropdown.test.tsx` covers
  controlled value + onChange.
- Full suite: 518/518 passing, including the four pre-existing
  `useFilter`-mocking tests that needed their mocks extended with the new
  context fields (`page.public`, `page.ux`, `redesign`,
  `RecipeList.skeleton`) — a direct consequence of widening
  `FilterContextType`, not a behaviour regression.
- `npm run lint` and `npx tsc --noEmit` both clean.

## Findings — none blocking

One pre-existing-pattern note, not changed: `RecipeModel.filterByIngredientsWithScore`
remains synchronous (delegated to by its `...Async` wrapper), matching the
ADR-008 SQLite-only model already in place for this method; out of scope to
refactor here.

## Out of Scope (confirmed, not implemented)

- `mealType` has no sidebar UI group (only `difficulty`/`maxTime`/tags do,
  per AC-017-06's explicit list) — the API still accepts it for future
  surfaces.
- `minRating`/`sort=rating` real ordering — REQ-018, currently degrades to
  default ordering as specified.
