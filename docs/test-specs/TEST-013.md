# TEST-013 — Unit Conversion & Recipe Scaling Test Specification

**Traces**: ARCH-013
**Verifies**: REQ-013 (AC-013-01 through AC-013-11)
**Version**: 1.0
**Date**: 2026-06-25
**Status**: Implemented — documented retroactively

> Test cases map to **existing** tests (≈85 cases across the files below, per
> the REC-109 code review).

---

## 1. Scope

Unit tests for `UnitConverter` and `RecipeScaler`; integration tests for the
scale endpoint and ingredient quantity normalisation.

---

## 2. Test Cases

### TC-013-01: Same-category conversions
**Verifies**: AC-013-01
**Test**: `src/__tests__/lib/units/converter.test.ts` → `convert - same category` (`converts TL to EL`, `converts TL to ml`, `converts ml to l`, `converts g to kg`)

### TC-013-02: Unknown / impossible unit errors
**Verifies**: AC-013-02, AC-013-03
**Test**: `converter.test.ts` → `throws UnknownUnitError for unknown unit`, `throws ImpossibleConversionError for incompatible units`

### TC-013-03: Cross-category via density
**Verifies**: AC-013-04
**Test**: `converter.test.ts` → `convert - cross-category with density` (`converts TL Mehl to g`, `converts EL Zucker to g`)

### TC-013-04: Missing density error
**Verifies**: AC-013-05
**Test**: `converter.test.ts` → `throws MissingDensityError when density not found`

### TC-013-05: Proportional scaling
**Verifies**: AC-013-06
**Test**: `src/__tests__/lib/units/scaler.test.ts` → `scales ingredient quantity by factor`; endpoint: `src/__tests__/api/recipes-scale.test.ts` → `scales down correctly (e.g., 4 servings → 2)`

### TC-013-06: Unit promotion
**Verifies**: AC-013-07
**Test**: `scaler.test.ts` → `promotes TL to EL when scaled quantity reaches threshold`, `promoteUnit` describe; `recipes-scale.test.ts` → `promotes units when threshold is exceeded (ml → l)`

### TC-013-07: Count/pinch preserved + rounded
**Verifies**: AC-013-08
**Test**: `scaler.test.ts` → `preserves Stück unit and rounds to integer`, `preserves Prise unit`, weight rounding cases

### TC-013-08: Scale validation (1–100), read-only
**Verifies**: AC-013-09
**Test**: `recipes-scale.test.ts` → error-path cases (invalid servings, recipe not found, missing fields)

### TC-013-09: Quantity normalisation on add
**Verifies**: AC-013-10
**Test**: `src/__tests__/unit/api/recipes/ingredients/unit-normalization.test.ts` → volume + weight normalisation describes (e.g. `creates ingredient with TL unit - normalized to ml (5ml per TL)`)

---

## 3. Notes

- AC-013-11 (lint / type-check / suite) is verified by the project commands.
- Coverage from REC-109: converter ~82%, scaler ~91%.
