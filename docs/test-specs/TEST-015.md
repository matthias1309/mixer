# TEST-015 — REWE-Style Layout & Recipe Card Redesign Test Specification

**Traces**: ARCH-015
**Verifies**: REQ-015 (AC-015-01 through AC-015-14)
**Version**: 1.0
**Date**: 2026-06-25
**Status**: draft

---

## 1. Scope

Component tests for the redesigned card, the image fallback, the numbered
pagination, and the filter panel shell. Styling-token assertions are kept
behavioural (structure/role/text), not pixel-level. Existing filter behaviour is
covered by regression of the current suite.

---

## 2. Test Cases

### TC-015-01: Card renders image-first with meta row
**Verifies**: AC-015-03
**Test**: `src/__tests__/components/RecipeCard.redesign.test.tsx` → `it('renders image before title and a meta row')`

### TC-015-02: Card exposes an (empty) tag slot
**Verifies**: AC-015-04
**Test**: `RecipeCard.redesign.test.tsx` → `it('renders no tag chips when tags are absent')`

### TC-015-03: Card keeps the phase score badge
**Verifies**: AC-015-05
**Test**: `RecipeCard.redesign.test.tsx` → `it('shows the score badge when score is provided')`

### TC-015-04: Real image shown when imagePath present
**Verifies**: AC-015-06
**Test**: `src/__tests__/components/RecipeImage.test.tsx` → `it('renders the photo when imagePath is set')`

### TC-015-05: Deterministic gradient fallback when no image
**Verifies**: AC-015-07
**Test**: `RecipeImage.test.tsx` → `it('renders a deterministic gradient + recipe name when imagePath is null')`, `it('produces the same gradient for the same id')`

### TC-015-06: Dashboard shows a search input
**Verifies**: AC-015-08
**Test**: `src/__tests__/app/dashboard/redesign.test.tsx` → `it('renders a search input above the results')`

### TC-015-07: Filter panel — phase group first & emphasised
**Verifies**: AC-015-09
**Test**: `src/__tests__/components/FilterPanel.test.tsx` → `it('renders the cycle-phase group first')`

### TC-015-08: Reset clears all filters
**Verifies**: AC-015-10
**Test**: `FilterPanel.test.tsx` → `it('clears active filters on reset')`

### TC-015-09: Results counter
**Verifies**: AC-015-11
**Test**: `src/__tests__/components/RecipeList.test.tsx` (extend) → `it('shows the number of matching recipes')`

### TC-015-10: Numbered pagination
**Verifies**: AC-015-12
**Test**: `src/__tests__/components/Pagination.test.tsx` → `it('renders numbered page links with the current page active')`

### TC-015-11: No filtering regression
**Verifies**: AC-015-13
**Test**: existing `RecipeList.test.tsx`, `PhaseFilter.test.tsx`, `IngredientFilter.search.test.tsx` remain green (same params/results)

---

## 3. Notes

- AC-015-01/02 (tokens, no `blue-*` literals) are verified by a lint-style grep
  assertion in `src/__tests__/app/dashboard/redesign.test.tsx`
  (`it('uses design tokens, not blue-* literals')`) plus visual preview check.
- AC-015-14 (lint / type-check / suite) is verified by the project commands.
