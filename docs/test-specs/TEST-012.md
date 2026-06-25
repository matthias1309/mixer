# TEST-012 — Nutrition Database & Calculation Test Specification

**Traces**: ARCH-012
**Verifies**: REQ-012 (AC-012-01 through AC-012-11)
**Version**: 1.0
**Date**: 2026-06-25
**Status**: Implemented — documented retroactively

> Test cases map to **existing** tests.

---

## 1. Scope

Unit tests for nutrient calculation/conversion and ingredient-master CRUD;
integration tests for the nutrition listing endpoint.

---

## 2. Test Cases

### TC-012-01: Create ingredient with nutrients → 201
**Verifies**: AC-012-01
**Test**: `src/__tests__/unit/api/ingredients-master/crud.test.ts` → `POST /api/ingredients-master` → `test('should create ingredient with valid data and return 201')`

### TC-012-02: Update / delete / detail
**Verifies**: AC-012-03
**Test**: `crud.test.ts` → `PUT /api/ingredients-master/[id]`, `DELETE /api/ingredients-master/[id]`, `GET /api/ingredients-master/[id]` describe blocks

### TC-012-03: List ordered by category, then name
**Verifies**: AC-012-04
**Test**: `src/__tests__/integration/nutrition/ingredients-api.test.ts` → `it('returns 200 with ingredients ordered by category, then name')`

### TC-012-04: Empty catalogue → empty list
**Verifies**: AC-012-05
**Test**: `ingredients-api.test.ts` → `it('returns 200 with an empty list when no ingredients exist')`

### TC-012-05: Total nutrients for a single ingredient
**Verifies**: AC-012-06
**Test**: `src/__tests__/unit/nutrition/calculator.test.ts` → `it('calculates total nutrients for single ingredient')`

### TC-012-06: Multiple ingredients sum
**Verifies**: AC-012-07
**Test**: `calculator.test.ts` → `it('handles multiple ingredients')`

### TC-012-07: Per-portion calculation + normalisation + invalid portions
**Verifies**: AC-012-08
**Test**: `src/__tests__/unit/nutrition/conversions.test.ts` → `calculatePerPortion` describe (`divides total by portions correctly`, `normalizes to 2 decimal places`, `throws error for zero portions`, `throws error for negative portions`) and `normalizeNutrientValue` describe

### TC-012-08: Salt included in totals
**Verifies**: AC-012-09
**Test**: `calculator.test.ts` → `it('includes salt in calculated totals')`; types in `src/__tests__/unit/nutrition/saltTypes.test.ts`

### TC-012-09: Unit-to-base conversion + unknown-unit error
**Verifies**: AC-012-10
**Test**: `conversions.test.ts` → `convertToBaseAmount` describe (`converts grams directly`, `converts pieces to grams (182g per piece)`, `throws error for unknown unit`)

---

## 3. Notes

- AC-012-02 (duplicate-name 409) is covered by the validation cases in
  `crud.test.ts`.
- AC-012-11 (lint / type-check / suite) is verified by the project commands.
- Per the nutrition code review, unit tests carry the primary coverage; the
  `nutrition-api.test.ts` integration cases are smoke-level.
