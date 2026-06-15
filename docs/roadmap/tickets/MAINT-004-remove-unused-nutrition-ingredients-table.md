# MAINT-004: Remove Unused `nutrition_ingredients` Table (Migration 002)

**Type**: Maintenance / Tech Debt
**Effort**: 2 story points
**Priority**: P3 (Nice to Have)
**Status**: Planned
**Phase**: Maintenance
**Order**: TBD

---

## Description

While fixing BUG-009 (`/api/nutrition/ingredients` queried the wrong
table), ARCH-008 identified that `nutrition_ingredients` — created in
`src/lib/db/migrations/002_create_nutrition_tables.sql` — is **dead**:

- It has a `category` column, just like `ingredients_master`
  (migration 005), which is the table the rest of the codebase actually
  uses for the ingredient/nutrition catalog (`IngredientMasterModelAsync`,
  `/api/ingredients-master`, all nutrient joins in `recipe.ts` /
  `recipe-async.ts`)
- Nothing in `src/` reads from or writes to `nutrition_ingredients`

This duplication is exactly what caused BUG-009: a "nutrition ingredients"
endpoint was pointed at the wrong, more nutrition-sounding table name.
Leaving the dead table in place keeps that ambiguity for the next person
who builds against the nutrition schema.

## Goal

Decide on and execute one of:

1. **Remove** `nutrition_ingredients` (and, if also unused,
   `ingredient_conversions` from the same migration) via a new migration
   that drops the table(s) — only if confirmed safe for existing
   SQLite/Postgres deployments
2. **Repurpose**: if a future nutrition feature needs per-unit
   conversions (`ingredient_conversions` references
   `nutrition_ingredients`), consolidate onto `ingredients_master`
   instead and then drop `nutrition_ingredients`

## Investigation Needed

- [ ] Confirm `ingredient_conversions` (also from migration 002) is
      either unused or can be repointed at `ingredients_master.id`
      before dropping `nutrition_ingredients`
- [ ] Check `src/db/seeds/ingredients.ts` — it inserts into
      `ingredient_conversions` referencing `ingredients.id`, which does
      **not** match either `nutrition_ingredients` (migration 002's FK
      target) or `ingredients_master`; this inconsistency should be
      resolved as part of this cleanup
- [ ] Verify no production data exists in `nutrition_ingredients` /
      `ingredient_conversions` before dropping (check Uberspace SQLite
      file)

## Acceptance Criteria

- [ ] `nutrition_ingredients` is either removed or actively used —
      no dead table with a name that overlaps `ingredients_master`'s
      purpose
- [ ] `ingredient_conversions`'s foreign key target is consistent with
      whichever ingredient table remains
- [ ] Migration is reviewed before running in production (per CLAUDE.md)
- [ ] `npm run lint`, `npm run type-check`, and `npm test` all pass

## Related Files

- `src/lib/db/migrations/002_create_nutrition_tables.sql`
- `src/lib/db/migrations/005_create_ingredients_master.sql`
- `src/db/seeds/ingredients.ts`
- `docs/architecture/ARCH-008.md` (origin of this ticket)
- `docs/roadmap/tickets/done/BUG-009-nutrition-ingredients-route-wrong-table.md`
