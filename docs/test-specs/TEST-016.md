# TEST-016 — Recipe Metadata & REWE Tag Vocabulary Test Specification

**Traces**: ARCH-016
**Verifies**: REQ-016 (AC-016-01 through AC-016-12)
**Version**: 1.0
**Date**: 2026-06-25
**Status**: draft

---

## 1. Scope

Unit tests for the vocabulary constants and validation; model tests for
persisting/reading metadata and tags; API tests for accept/reject; component
tests for the form inputs and card surfacing.

---

## 2. Test Cases

### TC-016-01: Vocabulary shape (from REWE)
**Verifies**: AC-016-01, AC-016-02
**Test**: `src/__tests__/unit/constants/tag-vocabulary.test.ts` → `it('exposes the REWE tag groups, difficulty levels, and meal types')`

### TC-016-02: Validation accepts in-vocabulary values
**Verifies**: AC-016-06
**Test**: `src/__tests__/unit/validation/recipe-metadata.test.ts` → `it('accepts a valid difficulty, mealType, time, and tags')`

### TC-016-03: Validation rejects out-of-vocabulary values
**Verifies**: AC-016-07
**Test**: `recipe-metadata.test.ts` → `it('rejects an unknown difficulty')`, `it('rejects an unknown mealType')`, `it('rejects an unknown tag')`

### TC-016-04: Validation rejects non-positive time
**Verifies**: AC-016-08
**Test**: `recipe-metadata.test.ts` → `it('rejects a zero/negative totalTimeMinutes')`

### TC-016-05: Migration is additive
**Verifies**: AC-016-03, AC-016-05
**Test**: `src/__tests__/lib/db/migrations/011-metadata.test.ts` → `it('adds nullable columns and leaves existing recipes valid')`

### TC-016-06: recipe_tags uniqueness & cascade
**Verifies**: AC-016-04
**Test**: `src/__tests__/lib/db/models/recipe-tags.test.ts` → `it('enforces unique (recipe_id, tag)')`, `it('cascades delete with the recipe')`

### TC-016-07: Model persists & reads metadata + tags
**Verifies**: AC-016-06
**Test**: `src/__tests__/lib/db/models/recipe.metadata.test.ts` → `it('stores and returns difficulty, time, mealType, and tags')`, `it('replaces the tag set on update')`

### TC-016-08: API rejects invalid metadata
**Verifies**: AC-016-07, AC-016-08
**Test**: `src/__tests__/unit/api/recipes/metadata.test.ts` → `it('returns 400 for an out-of-vocabulary tag')`, `it('returns 400 for non-positive time')`

### TC-016-09: Form inputs present & submit metadata
**Verifies**: AC-016-09
**Test**: `src/__tests__/unit/components/RecipeForm.metadata.test.tsx` → `it('renders effort/time/mealType/tags inputs and submits them')`, `it('pre-fills metadata when editing')`

### TC-016-10: Card shows time & effort when present
**Verifies**: AC-016-10
**Test**: `src/__tests__/components/RecipeCard.redesign.test.tsx` (extend) → `it('renders time and effort in the meta row when present')`, `it('omits them when absent')`

### TC-016-11: Card renders tag chips
**Verifies**: AC-016-11
**Test**: `RecipeCard.redesign.test.tsx` → `it('renders tag chips in the tag slot')`

---

## 3. Notes

- AC-016-12 (lint / type-check / suite) is verified by the project commands.
- Migration tests run against a throwaway in-memory SQLite db seeded with a
  pre-migration recipe (FIRST: independent, repeatable).
