# TEST-018 — Recipe Star Ratings Test Specification

**Traces**: ARCH-018
**Verifies**: REQ-018 (AC-018-01 through AC-018-11)
**Version**: 1.0
**Date**: 2026-06-25
**Status**: draft

---

## 1. Scope

Model tests for the upsert and aggregate; API tests for auth/validation;
integration tests for `minRating`/`sort=rating`; component tests for the star
widget and the card aggregate display.

---

## 2. Test Cases

### TC-018-01: Migration creates recipe_ratings with constraints
**Verifies**: AC-018-01
**Test**: `src/__tests__/lib/db/migrations/012-ratings.test.ts` → `it('creates recipe_ratings with a unique (user_id, recipe_id) and 1..5 check')`

### TC-018-02: Upsert inserts then updates (no duplicate)
**Verifies**: AC-018-02, AC-018-05
**Test**: `src/__tests__/lib/db/models/rating.test.ts` → `it('inserts a new rating')`, `it('updates the existing row on re-rating')`

### TC-018-03: Aggregate average & count
**Verifies**: AC-018-06
**Test**: `rating.test.ts` → `it('returns rounded average and count')`, `it('returns null/0 for an unrated recipe')`

### TC-018-04: Submit rating requires auth & valid range
**Verifies**: AC-018-02, AC-018-03, AC-018-04
**Test**: `src/__tests__/unit/api/recipes/rating.test.ts` → `it('stores a 1..5 rating for an authed user')`, `it('returns 400 for stars outside 1..5')`, `it('returns 401 for an anonymous request')`

### TC-018-05: Card shows aggregate vs empty state
**Verifies**: AC-018-07
**Test**: `src/__tests__/components/RecipeCard.rating.test.tsx` → `it('shows average and count when ratingCount > 0')`, `it('shows a neutral state when there are no ratings')`

### TC-018-06: Star widget reflects & submits rating
**Verifies**: AC-018-08
**Test**: `src/__tests__/components/StarRating.test.tsx` → `it('reflects the current rating and submits a change')`

### TC-018-07: minRating filter excludes unrated/below-threshold
**Verifies**: AC-018-09
**Test**: `src/__tests__/integration/recipes/rating-filter.test.ts` → `it('returns only recipes with average >= minRating')`, `it('excludes unrated recipes when minRating > 0')`

### TC-018-08: sort=rating orders by average desc
**Verifies**: AC-018-10
**Test**: `rating-filter.test.ts` → `it('orders recipes by average rating descending')`

---

## 3. Notes

- AC-018-11 (lint / type-check / suite) is verified by the project commands.
- Once REQ-018 lands, the TEST-017 `sort=rating` graceful-degradation case is
  superseded by real ordering coverage here.
- One rating per (user, recipe) is asserted at the **DB** level (constraint), not
  only via the model API.
