# TEST-010 — Menstrual Cycle Tracking Test Specification

**Traces**: ARCH-010
**Verifies**: REQ-010 (AC-010-01 through AC-010-09)
**Version**: 1.0
**Date**: 2026-06-25
**Status**: Implemented — documented retroactively

> These test cases map to **existing** tests. This spec was written after the
> fact to give the implemented suite formal V-Model traceability.

---

## 1. Scope

Unit tests for the phase calculation and integration tests for the cycle
endpoints (save/update, validation, auth, retrieval + current phase).

---

## 2. Test Cases

### TC-010-01: Calculate current phase for a 28-day cycle
**Verifies**: AC-010-04
**Test**: `src/__tests__/unit/cycle/calculator.test.ts` → `it('calculates current phase for 28-day cycle')`

### TC-010-02: Day 1 boundary
**Verifies**: AC-010-05
**Test**: `calculator.test.ts` → `it('handles day 1 of cycle')`

### TC-010-03: Phase on a specific date
**Verifies**: AC-010-04
**Test**: `calculator.test.ts` → `it('calculates phase on specific date')`

### TC-010-04: Different cycle lengths
**Verifies**: AC-010-06
**Test**: `calculator.test.ts` → `it('handles different cycle lengths')`

### TC-010-05: Save cycle returns 200
**Verifies**: AC-010-01
**Test**: `src/__tests__/integration/cycle/cycle-api.test.ts` → `POST /api/users/cycle` → `test('should save cycle data and return 200')`

### TC-010-06: Save requires authentication
**Verifies**: AC-010-03
**Test**: `cycle-api.test.ts` → `POST /api/users/cycle` → `test('should require authentication')`

### TC-010-07: Cycle length validation (21–35)
**Verifies**: AC-010-02
**Test**: `cycle-api.test.ts` → `POST /api/users/cycle` → `test('should validate cycle_length_days (21-35)')`

### TC-010-08: Retrieve returns current phase
**Verifies**: AC-010-07
**Test**: `cycle-api.test.ts` → `GET /api/users/cycle` → `test('should return current phase after saving cycle')`

### TC-010-09: Retrieve with no cycle → success:false
**Verifies**: AC-010-08
**Test**: `cycle-api.test.ts` → `GET /api/users/cycle` → `test('should return success:false if no cycle data')`

---

## 3. Notes

- AC-010-09 (lint / type-check / full suite) is verified by the project
  commands, not a dedicated case.
- Tests use the per-file SQLite database + JWT cookie pattern
  (`.claude/rules/learnings.md`).
