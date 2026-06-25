# TEST-011 — Cycle-Based Recipe Scoring Test Specification

**Traces**: ARCH-011
**Verifies**: REQ-011 (AC-011-01 through AC-011-10)
**Version**: 1.0
**Date**: 2026-06-25
**Status**: Implemented — documented retroactively

> Test cases map to **existing** tests; this spec gives the shipped suite formal
> traceability.

---

## 1. Scope

Unit tests for the phase-scoring algorithm and integration tests for the scored
recipe listing endpoint.

---

## 2. Test Cases

### TC-011-01: Score is within 0–100
**Verifies**: AC-011-01
**Test**: `src/__tests__/lib/scoring/phaseScore.test.ts` → `test('should return a score between 0 and 100')`

### TC-011-02: Unknown phase scores 0
**Verifies**: AC-011-02
**Test**: `phaseScore.test.ts` → `test('should return 0 for unknown phase')`

### TC-011-03: Empty nutrients score 0
**Verifies**: AC-011-03
**Test**: `phaseScore.test.ts` → `test('should return 0 for empty nutrients')`

### TC-011-04: Menstruation prioritises iron
**Verifies**: AC-011-04
**Test**: `phaseScore.test.ts` → `test('menstruation phase should prioritize iron')` and `test('iron-heavy nutrients should score differently for menstruation vs ovulation')`

### TC-011-05: Luteal prioritises magnesium
**Verifies**: AC-011-05
**Test**: `phaseScore.test.ts` → `test('luteal phase should prioritize magnesium')`

### TC-011-06: Normalised nutrients capped at 1.0
**Verifies**: AC-011-06
**Test**: `phaseScore.test.ts` → `test('should cap normalized nutrients at 1.0')`

### TC-011-07: Listing returns a score field
**Verifies**: AC-011-07
**Test**: `src/__tests__/integration/cycle-recommendations/filtering-api.test.ts` → `test('should return recipes with score field when phase parameter provided')`

### TC-011-08: Different phases → different scores
**Verifies**: AC-011-08
**Test**: `filtering-api.test.ts` → `test('should calculate different scores for different phases')`

### TC-011-09: Authenticated + paginated listing
**Verifies**: AC-011-09
**Test**: `filtering-api.test.ts` → `test('should work with authenticated user')` and `test('should support pagination with phase')`

---

## 3. Notes

- The follicular/B-vitamin and 70/30-blend behaviours have additional unit
  cases in `phaseScore.test.ts` (`follicular phase should prioritize B vitamins`,
  `high phase-specific nutrients should dominate score`).
- AC-011-10 (lint / type-check / suite) is verified by the project commands.
- The auxiliary `scorer.ts` has its own tests
  (`src/__tests__/unit/cycle-recommendations/scorer.test.ts`) but is not part of
  the live API path.
