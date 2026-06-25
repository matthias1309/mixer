# Code Review: REQ-018 — Recipe Star Ratings

**Date**: 2026-06-25
**Reviewer**: Claude Code
**Status**: ✅ APPROVED
**Branch**: working tree (not yet branched/committed)

---

## Summary

Adds 1–5 star ratings: a `recipe_ratings` table (one row per user/recipe,
upsert semantics), `ratingAverage`/`ratingCount` joined into the list/detail
responses, an interactive star widget on the detail page, the card's
aggregate display, and real `minRating`/`sort=rating` support that completes
the REQ-017 filter engine. Implemented per the V-Model sequence:
REQ-018 → ARCH-018 → TEST-018 → tests (red) → implementation (green).

**Scope / risk**: Low-medium. One additive schema migration (`012`); no
existing column or table is altered. Touches the **shared seams** flagged in
the feature map: `recipe-async.ts`/`recipe.ts` (also used by Scoring,
Nutrition, Photo, Filtering), `src/app/api/recipes/route.ts` (list) (also
used by Recipe CRUD, Scoring, search/sort, Filter Engine/017), and
`{RecipeCard,FilterPanel}.tsx` (also used by 015/016/017). Full suite
(535/535) passes after the change, including the pre-existing REQ-017 tests,
so the shared-seam blast radius is covered.

---

## Files Created / Modified

| File | Change |
|---|---|
| `src/lib/db/migrations/012_create_recipe_ratings.sql` | new — `recipe_ratings` table, composite PK `(user_id, recipe_id)`, `CHECK (stars BETWEEN 1 AND 5)`, recipe index |
| `src/lib/db/models/rating.ts` | new — `upsertRating`, `getUserRating`, `getRatingAggregate`, and the reusable `RATING_AGGREGATE_JOIN` SQL fragment |
| `src/lib/db/build-recipe-query.ts` | `minRating` predicate (`rr.avg_rating >= ?`); `sort=rating` now orders by the joined average (nulls last) instead of falling back to default |
| `src/lib/db/models/recipe-async.ts` | `listAllWithScoreAsync` joins `RATING_AGGREGATE_JOIN` in both the count and main query, selects `ratingAverage`/`ratingCount` |
| `src/lib/db/models/recipe.ts` | `filterByIngredientsWithScore(Async)` — same join/select, so `minRating`/`sort=rating` compose with ingredient filtering |
| `src/app/api/recipes/route.ts` | parses `minRating` and passes it through `RecipeQueryFilters` |
| `src/app/api/recipes/[id]/rating/route.ts` | new — `GET` (caller's current rating), `POST`/`PUT` (upsert, 1..5, 401 if anon, 400 if out of range) |
| `src/app/api/recipes/[id]/route.ts` | detail `GET` includes `ratingAverage`/`ratingCount` |
| `src/types/recipe.ts` | `RecipeListItem` gains `ratingAverage`/`ratingCount` |
| `src/components/recipe/StarRating.tsx` | new — controlled 1–5 star control (`rating`/`onRate` props) |
| `src/components/recipe/MinRatingFilter.tsx` | new — "Bewertung mindestens" select, mirrors `MaxTimeFilter` |
| `src/components/RecipeCard.tsx` | shows `"X.X ★ (N)"` or `"noch keine Bewertung"` |
| `src/contexts/FilterContext.tsx` | `minRating`/`setMinRating` state; `clearFilters` resets it |
| `src/components/RecipeList.tsx` | builds the `minRating` query param |
| `src/app/dashboard/page.tsx` | adds the "Bewertung" filter group; `minRating` counted in `hasActiveFilters` |
| `src/app/recipes/[id]/page.tsx` | fetches the caller's rating, renders `StarRating`, shows the aggregate, re-fetches the recipe after submitting a rating |
| `src/__tests__/**` | `012-ratings.test.ts`, `rating.test.ts` (model), `rating.test.ts` (API), `RecipeCard.rating.test.tsx`, `StarRating.test.tsx`, `rating-filter.test.ts` (integration); `build-recipe-query.test.ts` updated to assert the real `sort=rating`/`minRating` behaviour superseding the REQ-017 placeholder case; `detail.delete.test.tsx` mock made method/URL-aware so the new rating `GET` doesn't shift its positional mocks |

---

## SOLID Principles

- **SRP**: the rating aggregate SQL (`RATING_AGGREGATE_JOIN`) lives in one
  place (`rating.ts`) and is imported by both `recipe.ts` and
  `recipe-async.ts` rather than duplicated per query method.
- **OCP**: `RecipeQueryFilters` gains `minRating` additively — existing
  callers that don't pass it are unaffected (`filters = {}` default),
  confirmed by the full suite staying green.
- **DIP**: `route.ts` and the rating route depend on the model-layer
  functions (`upsertRating`, `getUserRating`, `buildRecipeQuery`) as
  abstractions; no raw SQL or vocabulary logic in the route handlers.

## DRY

- One SQL fragment (`RATING_AGGREGATE_JOIN`) is reused by both list/filter
  query methods instead of two near-identical subqueries.
- `MinRatingFilter` follows the exact `MaxTimeFilter` shape (controlled
  select backed by `FilterContext`) rather than inventing a new pattern.

## Correctness

- **One rating per user/recipe is enforced at the DB level**, not only in
  app code (AC-018-01, AC-018-05): the composite `PRIMARY KEY (user_id,
  recipe_id)` makes a second `INSERT` impossible; `upsertRating` relies on
  `ON CONFLICT(user_id, recipe_id) DO UPDATE` rather than a SELECT-then-
  branch, so the uniqueness guarantee comes from SQLite, not from the
  model's control flow — verified directly by `012-ratings.test.ts`
  (duplicate insert at the SQL level) and `rating.test.ts` (`updates the
  existing row on re-rating`, asserting exactly one row).
- The `CHECK (stars BETWEEN 1 AND 5)` constraint backs up the API's 1..5
  validation at the DB level; `012-ratings.test.ts` asserts both `0` and `6`
  are rejected by SQLite itself, independent of the API layer.
- **`minRating` excludes unrated recipes**, not just sorts them last
  (AC-018-09): `rr.avg_rating >= ?` is false (not "unknown-but-included")
  for a `NULL` average from the `LEFT JOIN`, so an unrated recipe never
  matches `minRating > 0` — verified by the dedicated `excludes unrated
  recipes when minRating > 0` integration test, not just inferred from the
  SQL.
- `RATING_AGGREGATE_JOIN` pre-aggregates per `recipe_id` *before* joining
  (`GROUP BY recipe_id` inside the subquery), so it's a 1:1 join against
  `recipes.id` and doesn't multiply the per-ingredient nutrient `SUM`s that
  the existing one-to-many `ingredients`/`ingredients_master` joins compute
  in the same `GROUP BY recipes.id` query — the existing REQ-011 scoring
  tests passing unmodified is the regression check for this.
- `getRatingAggregate` (single recipe, detail page) and the joined
  aggregate (list/filter, `COALESCE(rr.rating_count, 0)`) agree on the same
  null/0 contract (AC-018-06): both return `ratingAverage: null` exactly
  when `ratingCount: 0`, confirmed by both the model test and the
  integration test for an unrated recipe.
- `sort=rating`'s `rr.avg_rating IS NULL, rr.avg_rating DESC` puts unrated
  recipes last regardless of direction, mirroring the existing `sort=time`
  null-handling convention already established in REQ-017.

## Testing

- TDD followed: all TEST-018 cases written and confirmed red (10 failing
  assertions — missing module, missing predicate/order-by, missing UI text)
  before any implementation, then green.
- Migration (`012-ratings.test.ts`): table/columns exist, PK uniqueness and
  the 1..5 `CHECK` are enforced by SQLite directly (not just by app code).
- Model (`rating.test.ts`): insert, re-rate-updates-not-duplicates, rounded
  average + count, and the null/0 unrated case.
- API (`unit/api/recipes/rating.test.ts`): authed store, 400 for
  out-of-range stars, 401 for anonymous, and update-on-re-rate end to end
  through the real route handler.
- Integration (`rating-filter.test.ts`, real in-memory SQLite via the actual
  `GET /api/recipes` handler): `minRating` threshold, unrated exclusion, and
  `sort=rating` ordering.
- Component: `RecipeCard.rating.test.tsx` (aggregate vs. neutral state),
  `StarRating.test.tsx` (reflects current rating, submits a change via
  `aria-pressed` stars).
- Full suite: 535/535 passing. Two pre-existing tests needed updates as a
  direct, anticipated consequence of this change (not a behaviour
  regression): `build-recipe-query.test.ts`'s REQ-017 placeholder case for
  `sort=rating` — explicitly flagged in TEST-018 §3 as superseded once
  REQ-018 lands — was replaced with an assertion on the real ordering; and
  `detail.delete.test.tsx`'s positional `mockResolvedValueOnce` queue, which
  the new rating `GET` on the detail page would otherwise consume out of
  order, was switched to a method/URL-aware mock.
- `npm run lint` and `npx tsc --noEmit` both clean.

## Findings — none blocking

- `RATING_AGGREGATE_JOIN`'s `LEFT JOIN (... GROUP BY recipe_id) rr` is
  computed once per query rather than cached; for the current recipe counts
  this is negligible, and it matches the existing pattern of the
  per-ingredient nutrient aggregation already running in the same queries.
  Worth revisiting only if `recipe_ratings` grows large enough to matter.

## Out of Scope (confirmed, not implemented)

- Written reviews/comments — ratings only, per REQ-018 §4.
- Anti-abuse/rate-limiting beyond the one-row-per-user constraint, per
  REQ-018 §4.
