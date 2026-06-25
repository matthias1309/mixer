# ARCH-012 — Nutrition Database & Recipe Nutrient Calculation

**Traces**: REQ-012
**Version**: 1.0
**Date**: 2026-06-25
**Status**: Implemented — documented retroactively

---

## 1. Decision Summary

Nutrients live on a **shared `ingredients_master` catalogue** keyed by name; a
recipe references ingredients by name, and nutrient totals are derived by
joining recipe ingredients to the catalogue. There are two derivation paths in
the codebase:

1. **Inline aggregation** for listing/detail and scoring — a `SUM(... COALESCE
   ...) / base_size` join in `RecipeModelAsync.getNutrients()` /
   `listAllWithScoreAsync()`. No storage.
2. **Explicit calculate-and-store** — `POST /api/recipes/[id]/calculate`
   computes totals + per-portion values via `src/lib/nutrition/calculator.ts`
   and persists them to `recipe_nutrients`.

## 2. Data Model

- `ingredients_master` (migration `005_create_ingredients_master.sql`; `salt`
  column added by `004_add_salt_field.sql`): `name UNIQUE`, `category`,
  `base_unit`, `base_size`, plus ~15 nutrient columns.
- `recipe_nutrients` (migration `002_create_nutrition_tables.sql`): per-recipe
  `total_*` and `per_portion_*` columns + `portions`, keyed by recipe.

## 3. Calculation

`(quantity / base_size) × nutrient`, summed across ingredients. Inline form
(SQLite SQL):

```sql
SUM(COALESCE(im.<nutrient>,0) * COALESCE(i.quantity,0)
    / COALESCE(im.base_size,100)) AS <nutrient>
FROM ingredients i
LEFT JOIN ingredients_master im
  ON LOWER(TRIM(im.name)) = LOWER(TRIM(i.name))
WHERE i.recipe_id = ?
```

Library form (`src/lib/nutrition/`): `convertToBaseAmount()` →
`calculateRecipeNutrients()` → `calculatePerPortion()` →
`normalizeNutrientValue()` (2 decimals).

## 4. Components Touched

| File | Role |
|---|---|
| `src/lib/db/migrations/005_create_ingredients_master.sql` | catalogue table |
| `src/lib/db/migrations/004_add_salt_field.sql` | adds `salt` |
| `src/lib/db/migrations/002_create_nutrition_tables.sql` | `recipe_nutrients` |
| `src/lib/db/models/ingredientMasterAsync.ts` | catalogue CRUD |
| `src/lib/db/models/recipe-async.ts` | `getNutrients()` inline aggregation |
| `src/lib/nutrition/calculator.ts` | total + per-portion calculation |
| `src/lib/nutrition/conversions.ts` | `convertToBaseAmount`, `calculatePerPortion`, `normalizeNutrientValue` |
| `src/lib/nutrition/constants.ts` | `NUTRIENT_KEYS`, names, units |
| `src/app/api/ingredients-master/route.ts` + `[id]/route.ts` | catalogue CRUD API |
| `src/app/api/nutrition/ingredients/route.ts` | list endpoint (REQ-008) |
| `src/app/api/recipes/[id]/calculate/route.ts` | calculate + store nutrients |
| `src/components/forms/IngredientMasterForm.tsx` | nutrient entry form (incl. `Salz`) |

## 5. API

| Method | Path | Auth | Behaviour |
|---|---|---|---|
| GET | `/api/nutrition/ingredients` | public | list, ordered by category, name |
| GET | `/api/ingredients-master` (+ `/[id]`) | public | list / detail |
| POST/PUT/DELETE | `/api/ingredients-master` (+ `/[id]`) | required | catalogue mutations |
| POST | `/api/recipes/[id]/calculate` | required | compute + store `recipe_nutrients` |

## 6. Test Strategy

- Unit: `src/__tests__/unit/nutrition/{calculator,conversions,saltTypes}.test.ts`.
- Unit (CRUD): `src/__tests__/unit/api/ingredients-master/crud.test.ts`.
- Integration: `src/__tests__/integration/nutrition/{ingredients-api,nutrition-api}.test.ts`.

## 7. Related

REQ-012, REQ-008 (endpoint fix), REQ-011 (uses aggregates),
`docs/code-reviews/nutrition-database-implementation.md`, ADR-008.
