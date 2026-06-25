# TEST-014 — Recipe Photo OCR & Ingredient Extraction Test Specification

**Traces**: ARCH-014
**Verifies**: REQ-014 (AC-014-01 through AC-014-12)
**Version**: 1.0
**Date**: 2026-06-25
**Status**: Implemented — documented retroactively

> Test cases map to **existing** tests. The integration cases are smoke-level
> (tesseract.js is mocked in tests); parsing and matching carry the detailed
> unit coverage.

---

## 1. Scope

Unit tests for ingredient-line parsing and fuzzy matching; integration smoke
tests for the upload and status endpoints.

---

## 2. Test Cases

### TC-014-01: Parse a simple ingredient line
**Verifies**: AC-014-05, AC-014-06
**Test**: `src/__tests__/unit/ocr/parser.test.ts` → `it('parses simple ingredient line')`, `it('parses ingredient with unit')`

### TC-014-02: Parse multiple lines
**Verifies**: AC-014-07
**Test**: `parser.test.ts` → `it('handles multiple lines')`

### TC-014-03: Exact ingredient match
**Verifies**: AC-014-08
**Test**: `src/__tests__/unit/ocr/matcher.test.ts` → `it('finds exact match')`

### TC-014-04: Fuzzy ingredient match
**Verifies**: AC-014-09
**Test**: `matcher.test.ts` → `it('finds fuzzy match')`

### TC-014-05: No match → confidence 0
**Verifies**: AC-014-10
**Test**: `matcher.test.ts` → `it('returns null for no match')`

### TC-014-06: Upload accepted
**Verifies**: AC-014-01
**Test**: `src/__tests__/integration/ocr/ocr-api.test.ts` → `POST /api/recipes/ocr` → `it('accepts photo upload')`

### TC-014-07: Status polling
**Verifies**: AC-014-11
**Test**: `ocr-api.test.ts` → `GET /api/recipes/ocr/:uploadId` → `it('returns OCR processing status')`

---

## 3. Notes

- AC-014-02 (file-type/size rejection) and AC-014-03 (auth) are enforced via the
  shared `src/config/upload.ts` validation and the auth middleware; the
  validation logic is covered where `getValidationError` is exercised.
- AC-014-04 (tesseract deu+eng extraction) is exercised through the mocked
  tesseract wrapper in integration; real-image accuracy is not unit-tested.
- AC-014-12 (lint / type-check / suite) is verified by the project commands.
