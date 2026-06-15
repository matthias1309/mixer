# ARCH-008 — `/api/nutrition/ingredients` Query Fix

**Traces**: REQ-008
**Version**: 1.0
**Date**: 2026-06-15
**Status**: draft

---

## 1. Decision Summary

`GET /api/nutrition/ingredients` is repointed from the `ingredients`
table (recipe line-items, no `category` column) to `ingredients_master`
(the shared ingredient/nutrition reference table). The `ORDER BY
category, name` clause is kept unchanged, since both columns exist on
`ingredients_master`.

## 2. Why `ingredients_master` and not `nutrition_ingredients`

Two candidate tables have a `category` column:

| Table | Used by | Notes |
|---|---|---|
| `nutrition_ingredients` (migration 002) | nothing in `src/` | dead table — created but never read or written outside its own migration |
| `ingredients_master` (migration 005) | `IngredientMasterModelAsync`, `/api/ingredients-master`, all nutrient joins in `recipe-async.ts` / `recipe.ts` | the live ingredient catalog used for recipe nutrient calculation today |

`ingredients_master` is the table the rest of the codebase already treats
as "the nutrition ingredient catalog", so it is the correct target. No
schema migration is needed — both `category` and `name` already exist on
`ingredients_master`.

## 3. Change

**File**: `src/app/api/nutrition/ingredients/route.ts`

```diff
- const ingredients = db.prepare(
-   'SELECT * FROM ingredients ORDER BY category, name'
- ).all();
+ const ingredients = db.prepare(
+   'SELECT * FROM ingredients_master ORDER BY category, name'
+ ).all();
```

No other changes to the handler (response shape `{ status, data, total }`
is unchanged).

## 4. Test Strategy

Add an integration test
(`src/__tests__/integration/nutrition/ingredients-api.test.ts`) that:

1. Seeds two `ingredients_master` rows in different categories
2. Calls the route's `GET` handler directly (same pattern as
   `src/__tests__/unit/api/ingredients-master/crud.test.ts`)
3. Asserts HTTP 200 and that rows come back ordered by `category, name`

The existing placeholder smoke test in
`src/__tests__/integration/nutrition/nutrition-api.test.ts` is left as-is
(it only covers the calculate-nutrients endpoint going forward — the
ingredients case moves to the new file).

## 5. Out of Scope

- Building a frontend that consumes this endpoint (no UI calls it yet)
- Removing the unused `nutrition_ingredients` table / migration 002
  (separate cleanup, not part of this bug fix)

## 6. Related Decisions

- BUG-009 (ticket), REQ-008
