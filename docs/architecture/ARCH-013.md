# ARCH-013 — Unit Conversion & Recipe Scaling

**Traces**: REQ-013
**Version**: 1.0
**Date**: 2026-06-25
**Status**: Implemented — documented retroactively

> The architectural decision is recorded in **ADR-006 — Centralized Unit
> Conversion System**. This ARCH summarises the as-built structure and links the
> V-Model trace; ADR-006 remains the authoritative rationale.

---

## 1. Decision Summary

A three-layer, DB-backed design (ADR-006):

1. **Data**: `units`, `unit_conversions`, `ingredient_densities` tables (seeded
   from `src/db/seeds/units.ts`).
2. **Logic**: `UnitConverter` (loads the tables once into in-memory maps, then
   converts same-category directly and cross-category via density) and
   `RecipeScaler` (pure in-memory scaling + unit promotion + rounding).
3. **API**: `POST /api/recipes/[id]/scale` (read-only — returns scaled
   ingredients without persisting) and quantity normalisation when adding
   ingredients.

## 2. Data Model

Migrations:
- `006_create_units.sql` — `units(abbreviation UNIQUE, name, category, base_unit)`
- `007_create_unit_conversions.sql` — `unit_conversions(from_unit_id, to_unit_id, conversion_factor)`
- `008_create_ingredient_densities.sql` — `ingredient_densities(ingredient_name, volume_unit_id, weight_in_grams)`
- `009_add_normalized_fields.sql` — `ingredients.normalized_quantity`, `normalized_unit`

## 3. Components Touched

| File | Role |
|---|---|
| `src/lib/units/converter.ts` | `UnitConverter`: load + convert (same/cross-category) |
| `src/lib/units/scaler.ts` | `RecipeScaler`: scale, `promoteUnit`, rounding |
| `src/lib/units/types.ts` | error classes + interfaces |
| `src/lib/units/constants.ts` | categories, `UNIT_PROMOTION_RULES`, `ROUNDING_RULES`, bounds |
| `src/db/seeds/units.ts` | unit/conversion/density seed data |
| `src/app/api/recipes/[id]/scale/route.ts` | `POST` scale (validate 1–100, return scaled) |
| `src/app/api/recipes/[id]/ingredients/route.ts` | normalise quantity on add |

## 4. API

| Method | Path | Body | Behaviour |
|---|---|---|---|
| POST | `/api/recipes/[id]/scale` | `{ newServings: 1..100 }` | returns recipe with scaled+promoted ingredient quantities; persists nothing; 400 on out-of-range |
| POST | `/api/recipes/[id]/ingredients` | `{ name, quantity, unit }` | stores original + normalised (base-unit) quantity/unit |

## 5. Test Strategy

- `src/__tests__/lib/units/converter.test.ts` — same/cross-category conversion,
  error classes, normalisation.
- `src/__tests__/lib/units/scaler.test.ts` — scaling, promotion, rounding,
  count/pinch preservation.
- `src/__tests__/api/recipes-scale.test.ts` — scale endpoint happy/again
  error paths.
- `src/__tests__/unit/api/recipes/ingredients/unit-normalization.test.ts` —
  normalisation on ingredient add.

## 6. Related

REQ-013, ADR-006, `docs/code-reviews/REC-109-unit-conversion.md`,
`docs/features/unit-conversion.md`, ADR-008 (SQLite-only).
