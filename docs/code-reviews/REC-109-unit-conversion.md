# Code Review: REC-109 - Unit Conversion & Recipe Scaling

**Date**: 2026-05-21
**Reviewer**: Claude Code
**Status**: ✅ APPROVED
**Branch**: `2026-05-19-unit-conversion-recipe-scaling-design`
**PR**: #8

---

## Summary

Comprehensive unit conversion and recipe scaling system implemented. Supports TL, EL, ml, l, g, kg, Stück, Prise with automatic volume↔weight conversion via ingredient-specific densities and automatic recipe scaling by serving size with smart unit promotion.

---

## Implementation Review

### Files Created/Modified

**Database Layer**
1. `src/lib/db/migrations/006_create_units.sql` — Reference table for 8 supported units
2. `src/lib/db/migrations/007_create_unit_conversions.sql` — Conversion factors with ON DELETE RESTRICT
3. `src/lib/db/migrations/008_create_ingredient_densities.sql` — Density data for volume↔weight conversions
4. `src/lib/db/migrations/009_add_normalized_fields.sql` — normalized_quantity/normalized_unit on ingredients
5. `src/db/seeds/units.sql` — Idempotent SQL seed (INSERT OR IGNORE)
6. `src/db/seeds/units.ts` — TypeScript seed functions, wired into DB init

**Service Layer**
7. `src/lib/units/types.ts` — Error classes and data interfaces
8. `src/lib/units/constants.ts` — Unit categories, promotion rules, rounding rules
9. `src/lib/units/converter.ts` — UnitConverter: loads from DB, converts between units
10. `src/lib/units/scaler.ts` — RecipeScaler: pure in-memory scaling with promotion
11. `src/lib/units/index.ts` — Barrel export

**API Layer**
12. `src/app/api/recipes/[id]/scale/route.ts` — POST scale endpoint (read-only, no DB writes)
13. `src/app/api/recipes/[id]/ingredients/route.ts` — Ingredient creation with unit normalization

**Tests**
14. `src/__tests__/lib/units/converter.test.ts` — 37 tests, 82% coverage
15. `src/__tests__/lib/units/scaler.test.ts` — 14 tests, 91% coverage
16. `src/__tests__/api/recipes-scale.test.ts` — 18 integration tests
17. `src/__tests__/unit/api/recipes/ingredients/unit-normalization.test.ts` — 16 integration tests

**Documentation**
18. `docs/features/unit-conversion.md` — Feature guide with API reference
19. `docs/superpowers/specs/2026-05-19-unit-conversion-recipe-scaling-design.md` — Design spec

---

## Code Quality

### ✅ Strengths

**Architecture**
- Clean three-layer separation: DB tables → services → API routes
- `UnitConverter` and `RecipeScaler` have single responsibilities and are independently testable
- Load-once pattern: `initialize()` loads all data into Maps; conversions are pure Map lookups
- Scale endpoint is read-only (no DB writes) — clean, safe design

**Database**
- NUMERIC instead of DECIMAL for SQLite/PostgreSQL compatibility
- ON DELETE RESTRICT on all foreign keys (data integrity)
- Idempotent seed using INSERT OR IGNORE
- Seed auto-runs on DB initialization — no manual seeding step in production

**Error Handling**
- Four distinct error types: UnknownUnitError, ImpossibleConversionError, MissingDensityError, OutOfRangeError
- 400 returned for unknown units in API (not 500)
- Stück/Prise allowed with null normalized values (graceful degradation)
- Guard against recipe.servings = 0 (division-by-zero prevention)

**Testing**
- TDD approach throughout — tests written before implementation
- Tests use real temporary SQLite databases (no mocking of DB layer)
- Seed constants shared between tests and production (stays in sync)

### ⚠️ Issues Found & Fixed During Review

| Issue | Severity | Fix |
|-------|----------|-----|
| EL→ml promotion factor inverted (1/15 instead of 15) | Critical | Fixed in commit `290607e` |
| UnitConverter initialized but never used in scale route | Important | Removed dead code in `5a55541` |
| Seed data not wired into DB startup | Important | Fixed in commit `290607e` |
| SQL seed not idempotent (plain INSERT) | Important | Fixed with INSERT OR IGNORE |
| Function name conflict (seedConversions) | Important | Renamed to seedUnitConversions |
| Ingredient quantity integer-only validation | Minor | Documented — intentional for MVP |

---

## Test Results

```
Test Suites: 43 passed, 1 failed (pre-existing), 44 total
Tests:       401 passed, 1 failed (pre-existing), 402 total
Time:        11.6s

New tests: 85 total
  converter.test.ts:   37 tests — PASS
  scaler.test.ts:      14 tests — PASS
  recipes-scale:       18 tests — PASS
  normalization:       16 tests — PASS

Coverage (src/lib/units/):
  UnitConverter:  82% statements, 83% branches
  RecipeScaler:   91% statements, 87% branches
  (Remaining gap: PostgreSQL paths — not testable without PG instance)
```

Pre-existing failure: `ingredientMasterAsync.test.ts` — duplicate rejection test unrelated to this feature.

---

## Acceptance Criteria

- [x] Units table with 8 units (TL, EL, ml, l, g, kg, Stück, Prise)
- [x] Conversion factors between compatible units
- [x] Ingredient density data for volume↔weight conversion
- [x] UnitConverter service with convert(), normalizeToBaseUnit(), getConversionFactor()
- [x] RecipeScaler service with scaleIngredient() and promoteUnit()
- [x] POST /api/recipes/{id}/scale endpoint (read-only)
- [x] Ingredient creation validates and normalizes units
- [x] Error types for all failure cases
- [x] Tests with 80%+ coverage (82-91% achieved)
- [x] Documentation updated (feature guide + Arc42 + ADR)
- [x] Seed data auto-applied on DB initialization
- [x] Backward compatible with existing ingredients

---

## Definition of Done

- [x] Tests written and passing (TDD)
- [x] Code reviewed and issues fixed
- [x] Documentation updated (Arc42, ADR-006, feature guide)
- [x] No breaking changes to existing functionality
- [x] PR #8 created

---

## Key Decisions

1. **Centralized unit management** — Single `units` table as source of truth, not hardcoded constants
2. **Load-once pattern** — UnitConverter loads all data at init, conversions are in-memory Map lookups (fast)
3. **Scale endpoint is read-only** — Does not persist scaled values; caller decides whether to save
4. **Graceful degradation for Stück/Prise** — Non-normalizable units accepted with null normalized fields
5. **Integer-only quantities in MVP** — Decimal quantities deferred to future ticket (realistic but out of scope)

---

## Signature

✅ **Approved for merge**

Clean architecture with proper separation of concerns, comprehensive test coverage, and all critical issues found and fixed during review.
