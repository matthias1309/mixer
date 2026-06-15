# TEST-009 — Recipe Photo Test Specification

**Traces**: ARCH-009
**Verifies**: REQ-009 (AC-009-01 through AC-009-09)
**Version**: 1.0
**Date**: 2026-06-15
**Status**: draft

---

## 1. Scope

Unit/integration tests for the recipe photo upload endpoint, the serve
endpoint, the stored `image_path`, and the dashboard list field.

---

## 2. Test Cases

### TC-009-01: Owner uploads a valid image
**Verifies**: AC-009-01, AC-009-03

```gherkin
Given a recipe owned by user1
When user1 POSTs a valid PNG to /api/recipes/{id}/image
Then the response status is 200
And the recipe's image_path is set
And GET /api/recipes/{id} returns a truthy imagePath
```

### TC-009-02: Replacing an existing image
**Verifies**: AC-009-03

```gherkin
Given a recipe owned by user1 that already has a photo
When user1 POSTs a new valid JPG to /api/recipes/{id}/image
Then the response status is 200
And the recipe's image_path reflects the new file
```

### TC-009-03: Non-owner cannot upload
**Verifies**: AC-009-04

```gherkin
Given a recipe owned by user1
When user2 POSTs an image to /api/recipes/{id}/image
Then the response status is 403
And the recipe's image_path is unchanged
```

### TC-009-04: Unauthenticated upload rejected
**Verifies**: AC-009-04

```gherkin
Given a recipe owned by user1
When an anonymous client POSTs an image to /api/recipes/{id}/image
Then the response status is 401
```

### TC-009-05: Invalid file type rejected
**Verifies**: AC-009-02

```gherkin
Given a recipe owned by user1
When user1 POSTs a text/plain file to /api/recipes/{id}/image
Then the response status is 400
And the recipe's image_path is not set
```

### TC-009-06: Serve a stored image
**Verifies**: AC-009-05

```gherkin
Given a recipe with a stored PNG photo
When GET /api/recipes/{id}/image is called
Then the response status is 200
And the Content-Type is image/png
```

### TC-009-07: Serve returns 404 without a photo
**Verifies**: AC-009-06

```gherkin
Given a recipe without a photo
When GET /api/recipes/{id}/image is called
Then the response status is 404
```

### TC-009-08: List surfaces imagePath
**Verifies**: AC-009-07

```gherkin
Given a recipe with a stored photo
When the recipe list is loaded via listAllWithScoreAsync
Then the matching list item has a truthy imagePath
```

---

## 3. Test Implementation Notes

- File: `src/__tests__/unit/api/recipes/image.test.ts`
- Follow the per-test SQLite db + JWT cookie pattern from
  `src/__tests__/unit/api/recipes/crud.test.ts` (fresh `.data/*.db` per
  test file, per `.claude/rules/learnings.md`).
- Build uploads with the global `File` + `FormData` (undici) and pass the
  `FormData` as the `NextRequest` body.
- Set `UPLOAD_CONFIG`-relative files are written under a temp dir that the
  test cleans up in `afterEach`.
- AC-009-08 (no-image fallback) and AC-009-09 (lint/type-check/full
  suite) are verified by the React card behaviour and the project
  commands respectively, not by a route test case.
