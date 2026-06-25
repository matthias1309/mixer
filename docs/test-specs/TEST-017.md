# TEST-017 — REWE-Style Filter & Sort Engine Test Specification

**Traces**: ARCH-017
**Verifies**: REQ-017 (AC-017-01 through AC-017-10)
**Version**: 1.0
**Date**: 2026-06-25
**Status**: draft

---

## 1. Scope

Unit tests for `buildRecipeQuery`; integration tests (real in-memory SQLite,
seeded recipes + tags) for filtering, composition, and sorting; component tests
for the new filter groups and the sort dropdown.

---

## 2. Test Cases

### TC-017-01: Single-dimension filters narrow results
**Verifies**: AC-017-01
**Test**: `src/__tests__/integration/recipes/filter-engine.test.ts` → `it('filters by difficulty')`, `it('filters by maxTime')`, `it('filters by mealType')`, `it('filters by a single tag')`

### TC-017-02: Multiple tags are AND-combined
**Verifies**: AC-017-02
**Test**: `filter-engine.test.ts` → `it('returns only recipes carrying every requested tag')`

### TC-017-03: New filters compose with phase + ingredients
**Verifies**: AC-017-03
**Test**: `filter-engine.test.ts` → `it('applies phase, ingredients, and metadata filters together')`

### TC-017-04: Invalid filter value is ignored, never 500s
**Verifies**: AC-017-04
**Test**: `filter-engine.test.ts` → `it('ignores an unknown difficulty and returns 200')`

### TC-017-05: Sorting
**Verifies**: AC-017-05
**Test**: `src/__tests__/unit/lib/db/build-recipe-query.test.ts` → `it('orders by time ascending for sort=time')`, `it('falls back to default for sort=rating when no rating data')`

### TC-017-06: buildRecipeQuery predicate shape
**Verifies**: AC-017-01, AC-017-02
**Test**: `build-recipe-query.test.ts` → `it('emits a HAVING COUNT predicate for AND tags')`, `it('binds all user values as parameters')`

### TC-017-07: Filter panel renders new groups
**Verifies**: AC-017-06, AC-017-07
**Test**: `src/__tests__/components/FilterPanel.groups.test.tsx` → `it('renders Ernährung/Hauptzutat/Ernährungsform/Backen/Anlässe, Aufwand, max-time')`, `it('keeps the cycle-phase group first')`

### TC-017-08: Filter change updates list & reset clears new groups
**Verifies**: AC-017-08
**Test**: `FilterPanel.groups.test.tsx` → `it('updates active filters on selection')`, `it('reset clears the new groups too')`

### TC-017-09: Sort dropdown drives the param
**Verifies**: AC-017-09
**Test**: `src/__tests__/components/SortDropdown.test.tsx` → `it('emits the selected sort value')`

---

## 3. Notes

- AC-017-10 (lint / type-check / suite) is verified by the project commands.
- `sort=rating` / `minRating` data is produced by REQ-018; here `sort=rating`
  is asserted only to **degrade gracefully** to the default ordering.
- Integration seeds recipes with known difficulty/time/mealType/tags so each
  assertion is deterministic (FIRST).
