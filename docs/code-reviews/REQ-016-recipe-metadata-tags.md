# Code Review: REQ-016 — Recipe Metadata & REWE Tag Vocabulary

**Date**: 2026-06-25
**Reviewer**: Claude Code
**Status**: ✅ APPROVED (3 of 7 review findings fixed, 4 documented as follow-ups)
**Branch**: `feature/recipe-metadata-tags`

---

## Summary

Adds the data foundation for REWE-style filtering: `difficulty`,
`total_time_minutes`, and `meal_type` columns on `recipes`, plus a normalised
`recipe_tags` n:m relation against a fixed vocabulary in
`src/lib/constants.ts`. The recipe form gains effort/time/meal-type/tag
inputs; the card surfaces time, effort, and tag chips in the slot introduced
by REQ-015. Implemented per the V-Model sequence: REQ-016 → ARCH-016 →
TEST-016 → tests (red) → implementation (green).

**Scope / risk**: Low-medium. Additive migration only (`011_*.sql`); the
existing `POST`/`PUT /api/recipes` contract gains optional fields only.
Touches two shared seams flagged in the feature map: `recipe-async.ts` /
`recipe.ts` (also used by Scoring/Nutrition/Photo) and
`RecipeCard.tsx`/`FilterPanel.tsx` (also used by REQ-015/017/018).

**Environment note**: `better-sqlite3`'s native binding was compiled against
a newer Node than the project's pinned `.nvmrc` (22), causing
`initializeDatabase()` to throw `NODE_MODULE_VERSION` mismatch errors before
any code in this PR ran. Fixed by rebuilding under `nvm use 22`; unrelated to
this change but blocked all verification until resolved.

---

## Files Created / Modified

| File | Change |
|---|---|
| `src/lib/db/migrations/011_add_recipe_metadata.sql` | new — additive columns + `recipe_tags` table |
| `src/lib/constants.ts` | `DIFFICULTY_LEVELS`, `MEAL_TYPES`, `TAG_GROUPS`, `TAG_VOCABULARY`, `isValid*` helpers |
| `src/lib/validation.ts` | `validateDifficulty/MealType/Tags/TotalTimeMinutes`, `validateRecipeMetadataFields` |
| `src/lib/db/models/recipeTags.ts` | new — shared `replaceRecipeTags`/`getRecipeTags`/`getTagsForRecipeIds` |
| `src/lib/db/models/recipe.ts`, `recipe-async.ts` | create/update/list persist & read metadata + tags |
| `src/types/recipe.ts` | `Recipe`, `RecipeListItem`, `CreateRecipeRequest`, `UpdateRecipeRequest`, `RecipeMetadataInput` extended |
| `src/app/api/recipes/route.ts`, `[id]/route.ts` | validate & persist metadata; GET/POST/PUT responses carry it |
| `src/app/recipes/[id]/edit/page.tsx` | `RecipeData` extended so the form can pre-fill metadata |
| `src/components/forms/RecipeForm.tsx` | effort/time/meal-type selects + tag checkboxes |
| `src/components/RecipeCard.tsx` | time/effort in the meta row |
| `src/__tests__/**` | 9 new TEST-016 spec files/cases; `RecipeCard.redesign.test.tsx` extended |

---

## SOLID Principles

- **SRP**: vocabulary lives only in `constants.ts`; validation only in
  `validation.ts`; tag persistence only in `recipeTags.ts` — no model class
  re-implements vocabulary or validation logic.
- **OCP**: `RecipeCardProps`'s pre-existing `tags?: string[]` slot (from
  REQ-015) absorbed the new chips without changing the card's structure;
  `totalTimeMinutes`/`difficulty` were added as optional props alongside it.
- **DIP**: routes depend on `validateRecipeMetadataFields()` as an
  abstraction, not on the four individual validators directly.

## Clean Code (DRY / KISS / YAGNI)

- **DRY**: tag-batch-fetch logic was initially duplicated across
  `recipe.ts`/`recipe-async.ts` (Finding 2) and the 4-field validation was
  duplicated across POST/PUT (Finding 3) — both consolidated during review
  (see below), into `recipeTags.ts`'s `getTagsForRecipeIds` and
  `validation.ts`'s `validateRecipeMetadataFields` respectively.
- **KISS**: tags are fetched via a second batched query rather than a
  `GROUP_CONCAT` correlated subquery — more round-trips, but keeps the
  existing nutrient-aggregation SQL untouched instead of restructuring it.
- **YAGNI**: no tag-group abstraction was carried into the API response;
  `TAG_GROUPS` only drives the form's checkbox grouping, since REQ-017 (the
  filter UI) is explicitly out of scope here.

---

## Acceptance Criteria

| AC | Status | Evidence |
|---|---|---|
| AC-016-01/02 fixed vocabulary, difficulty/mealType enums | ✅ | TC-016-01 |
| AC-016-03/05 additive migration, existing recipes stay valid | ✅ | TC-016-05 |
| AC-016-04 `recipe_tags` uniqueness + cascade | ✅ | TC-016-06 |
| AC-016-06 create/update accept optional metadata + tags | ✅ | TC-016-02, TC-016-07 |
| AC-016-07 reject out-of-vocabulary values (400) | ✅ | TC-016-03, TC-016-08 |
| AC-016-08 reject non-positive `totalTimeMinutes` (400) | ✅ | TC-016-04, TC-016-08 |
| AC-016-09 form inputs render, submit, and pre-fill | ✅ | TC-016-09 |
| AC-016-10 card shows time/effort when present, omits when absent | ✅ | TC-016-10 |
| AC-016-11 card renders tag chips | ✅ | TC-016-11 |
| AC-016-12 lint / type-check / tests pass | ✅ | see below |

---

## Code Quality

```
npx tsc --noEmit   → 0 errors
npm run lint       → 0 warnings (--max-warnings=0)
npm test           → 491/491 passing (489 after initial implementation + 2 regression tests added during review)
```

---

## Review Findings

A code-review pass (8 finder angles via parallel subagents: line-by-line,
removed-behaviour, cross-file, reuse, simplification, efficiency, altitude,
CLAUDE.md conventions) surfaced 9 candidates; 2 were refuted on inspection,
7 confirmed/plausible. 3 were fixed in this branch; 4 are documented
follow-ups.

### Fixed

1. **Metadata could not be cleared back to `null` — `RecipeForm.tsx`,
   both API routes, `validation.ts`.** The form sent `undefined` (an omitted
   JSON key) instead of `null` when the user reset `difficulty`/`mealType`/
   `totalTimeMinutes` to "–", and the validators rejected `null` as an
   invalid value even when sent deliberately. Net effect: selecting "–" and
   saving silently left the old value in the database with no error shown.
   Fixed by treating `null` as "explicitly cleared" in
   `validateDifficulty`/`validateMealType`/`validateTotalTimeMinutes`, and by
   having `RecipeForm` send `null` rather than `undefined`. Covered by a new
   regression test in `unit/api/recipes/metadata.test.ts` and
   `unit/validation/recipe-metadata.test.ts`.
2. **Tag-batch-fetch helper duplicated — `recipe.ts` (`getRecipeTagsForIds`)
   vs. `recipe-async.ts` (`getTagsForRecipes`).** Byte-for-byte identical
   logic under two names in two files. Consolidated into
   `recipeTags.ts`'s `getTagsForRecipeIds`, imported by both models.
3. **8 duplicated metadata-validation blocks — `route.ts` (POST) and
   `[id]/route.ts` (PUT).** The same four
   `if (body.X !== undefined) { validate; 400 }` blocks were copy-pasted in
   both handlers. Collapsed into `validateRecipeMetadataFields()` in
   `validation.ts`, called once per handler.

### Documented follow-ups (non-blocking)

4. **Recipe detail page doesn't surface the new fields —
   `src/app/recipes/[id]/page.tsx`.** `GET /api/recipes/[id]` now returns
   `difficulty`/`totalTimeMinutes`/`tags`, and the dashboard card shows them,
   but the detail page's `RecipeDetail` interface and JSX don't. ARCH-016
   §4 ("Components Touched") only lists `RecipeCard.tsx`, so this reads as
   intentionally out of scope for REQ-016 rather than a regression — flagged
   so it isn't lost before REQ-017/018 build on top of it.
5. **Extra DB round-trip after create/update — both API routes.** POST/PUT
   call `RecipeModelAsync.getTags(recipe.id)` to build the response
   immediately after `create()`/`update()` already wrote that exact tag set
   from `body.tags`. Not a correctness issue (in-process SQLite, no network
   latency), just an avoidable second `SELECT`.
6. **Unguarded vocabulary cast — `RecipeCard.tsx`.**
   `DIFFICULTY_LABELS[props.difficulty as DifficultyLevel]` renders
   `undefined` with no fallback if a recipe's stored `difficulty` is ever
   outside the current vocabulary (e.g. after a future vocabulary change).
   Low risk today since the value is validated at write time.
7. **Asymmetric `tags` guard between create and update — `recipe.ts`,
   `recipe-async.ts`.** `create()` checks `if (metadata?.tags)` (truthy),
   `update()` checks `!== undefined`. Currently harmless (a brand-new recipe
   has no existing tags to fail to clear), but the two code paths use
   different "is this field present" semantics for the same field.

### Refuted during review

- **`recipe_tags` `ON DELETE CASCADE` depends on a `PRAGMA foreign_keys`
  that's never set** — checked empirically
  (`db.pragma('foreign_keys')` → `1`); `better-sqlite3`'s bundled SQLite
  enables it by default, and the cascade-delete test passes. Not a bug.
- **Sibling method `RecipeModel.listAllWithScore` (no ingredient filter)
  wasn't updated with the new metadata/tags columns** — verified it has zero
  production call sites (only exercised by tests), so this is dead-code
  inconsistency, not a user-facing gap.

---

## Key Decisions

1. **Scalar columns vs. n:m table** — `difficulty`/`total_time_minutes`/
   `meal_type` are plain columns; the multi-valued REWE categories are a
   normalised `recipe_tags` relation, per ARCH-016 §1, so REQ-017 can filter
   by individual tags with an indexed column instead of parsing a blob.
2. **New `metadata` parameter as an options object, not 4 more positional
   params** — `RecipeModel(Async).create/update` already had 6-7 positional
   parameters before this change; the new fields were grouped into one
   trailing `RecipeMetadataInput` object instead of extending the positional
   list further, partially addressing (without fully refactoring) the
   existing `coding-style.md` "minimize parameters" guidance.
3. **Tags fetched via a second batched query, not a `LEFT JOIN`** — the
   existing nutrient-aggregation queries already `LEFT JOIN ingredients` for
   per-recipe `SUM`s; joining `recipe_tags` (also one-to-many) into the same
   query would have multiplied out those sums. Batching a second `SELECT ...
   WHERE recipe_id IN (...)` for the current page avoids both the N+1
   problem and the join-multiplication bug.
4. **`null` means "clear", `undefined`/omitted means "leave untouched"** —
   established after the review fix, consistent with how `description`/
   `instructions` already behave in the same routes.

---

## Signature

✅ **Approved for merge.** All stated acceptance criteria are met,
lint/type-check/tests pass (491/491), and the one functional bug found in
review (clear-to-null) plus both DRY violations are fixed with regression
coverage. Remaining follow-ups are explicitly scoped, non-blocking, and
listed above for REQ-017/018 to pick up.
