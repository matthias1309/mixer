# TEST-008 — `/api/nutrition/ingredients` Query Fix Test Specification

**Traces**: ARCH-008
**Verifies**: REQ-008 (AC-008-01 through AC-008-05)
**Version**: 1.0
**Date**: 2026-06-15
**Status**: draft

---

## 1. Scope

Integration test for `GET /api/nutrition/ingredients`, covering the fix
from the non-existent `ingredients.category` column / wrong table to
`ingredients_master`.

---

## 2. Test Cases

### TC-008-01: Returns 200 with ingredients ordered by category, then name
**Verifies**: AC-008-01, AC-008-02, AC-008-03

```gherkin
Given the ingredients_master table contains:
  | name   | category |
  | Banane | Obst     |
  | Apfel  | Obst     |
  | Reis   | Getreide |
When GET /api/nutrition/ingredients is called
Then the response status is 200
And response.data is ordered: Reis (Getreide), Apfel (Obst), Banane (Obst)
And response.total equals 3
```

### TC-008-02: Returns 200 with empty list when no ingredients exist
**Verifies**: AC-008-01

```gherkin
Given the ingredients_master table is empty
When GET /api/nutrition/ingredients is called
Then the response status is 200
And response.data is an empty array
And response.total equals 0
```

---

## 3. Test Implementation Notes

- File: `src/__tests__/integration/nutrition/ingredients-api.test.ts`
- Follow the SQLite test-db setup pattern from
  `src/__tests__/unit/api/ingredients-master/crud.test.ts`
  (`initializeDatabase` / `closeDatabase` against a per-test `.data/*.db`
  file, per `.claude/rules/learnings.md` — fresh database per test file)
- No authentication required (GET is a public read endpoint)
- TC-008-01/02 cover AC-008-04 (regression test); AC-008-05 (lint,
  type-check, full test suite) is verified by running the project
  commands, not by a test case
