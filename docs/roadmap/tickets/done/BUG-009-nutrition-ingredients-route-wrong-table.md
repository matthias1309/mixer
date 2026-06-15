# BUG-009: `/api/nutrition/ingredients` queries a non-existent `category` column

**Type**: Bug
**Effort**: 2 story points
**Priority**: P1 (Blocker — endpoint returns 500)
**Status**: Done
**Phase**: Maintenance
**Order**: TBD
**Traceability**: REQ-008, ARCH-008, TEST-008

---

## Description

The `GET /api/nutrition/ingredients` endpoint always fails with HTTP 500.
It runs `SELECT * FROM ingredients ORDER BY category, name`, but the
`ingredients` table has no `category` column, so SQLite raises
`SqliteError: no such column: category` and the handler returns
`{ status: 500, error: 'Failed to fetch ingredients' }`.

This was discovered while debugging the Uberspace production outage
(MAINT-003 Phase 4) but is an independent, pre-existing defect — it is
not caused by the deployment or the database engine, and it would fail
the same way on the old PostgreSQL setup.

## Root Cause

`src/app/api/nutrition/ingredients/route.ts` (line 8–10):

```typescript
const ingredients = db.prepare(
  'SELECT * FROM ingredients ORDER BY category, name'
).all();
```

The `ingredients` table is defined in
`src/lib/db/migrations/001_create_schema.sql` with only these columns:

```sql
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);
```

There is no `category` column. Note also that `ingredients` is the
**recipe line-items** table (rows tied to a `recipe_id`), which is almost
certainly *not* what a "nutrition ingredients" endpoint should return.

## Investigation needed (likely wrong table, not just wrong column)

This is a **nutrition** endpoint, so the intended table is most likely
`nutrition_ingredients` (migration `002_create_nutrition_tables.sql`),
which *does* have a `category` column — or possibly `ingredients_master`
(migration `005_create_ingredients_master.sql`), which also has
`category`. The fixing session must confirm the correct domain table by
checking what consumes this endpoint on the client before changing the
query. Simply dropping `category` from the `ORDER BY` would stop the 500
but would still return the wrong data (recipe line-items instead of the
nutrition/master ingredient list).

## Acceptance Criteria

- [x] `GET /api/nutrition/ingredients` returns HTTP 200 with a JSON list
- [x] The query targets the correct domain table (verified against the
      client code that calls this endpoint)
- [x] `ORDER BY` only references columns that exist on that table
- [x] A test reproduces the original failure and passes after the fix
      (TDD: write the failing test first per `.claude/rules/v-model.md`)
- [x] `npm run lint`, `npm run type-check`, and `npm test` all pass

## Related Files

- `src/app/api/nutrition/ingredients/route.ts` (the buggy query)
- `src/lib/db/migrations/001_create_schema.sql` (`ingredients` table)
- `src/lib/db/migrations/002_create_nutrition_tables.sql` (`nutrition_ingredients`)
- `src/lib/db/migrations/005_create_ingredients_master.sql` (`ingredients_master`)

## Resolution

The endpoint now queries `ingredients_master` (the table already used for
all other nutrient lookups in the app), keeping `ORDER BY category, name`
unchanged since both columns exist there. The unused `nutrition_ingredients`
table (migration 002) was confirmed to be dead code and left untouched —
see ARCH-008 for the table comparison.

## Definition of Done

- [x] Endpoint returns 200 with correct data
- [x] Regression test added and green
- [x] Lint, type-check, and full test suite pass
- [ ] Code review approved
