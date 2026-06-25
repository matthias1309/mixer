# ARCH-014 — Recipe Photo OCR & Ingredient Extraction

**Traces**: REQ-014
**Version**: 1.0
**Date**: 2026-06-25
**Status**: Implemented — documented retroactively

---

## 1. Decision Summary

OCR is an **async pipeline behind a polling API**, kept separate from the JSON
recipe contract. Upload returns an `uploadId` immediately; processing
(text extraction → parse → match) runs in the background and writes results to
an in-memory cache; the client polls until results are ready, reviews/corrects
them, and then creates the recipe through the normal `POST /api/recipes`.
Local tesseract.js avoids any external OCR service.

```
POST /api/recipes/ocr (multipart) ── validate ─▶ uploadId, status:processing
        │ (async)
        ▼
 extract text (tesseract deu+eng) ─▶ parse lines ─▶ fuzzy-match catalogue ─▶ cache: complete
        ▲
 GET /api/recipes/ocr/[uploadId] ◀── poll ── client review/correct
        │
        ▼
 POST /api/recipes (existing contract) ─▶ recipe created
```

## 2. Components Touched

| File | Role |
|---|---|
| `src/lib/ocr/tesseract.ts` | `extractTextFromImage(buffer)` (tesseract.js, deu+eng) |
| `src/lib/ocr/parser.ts` | `parseIngredientsFromText()` — line → {amount, unit, name} |
| `src/lib/ocr/matcher.ts` | `findBestMatch()` — Levenshtein + synonyms → {ingredient, confidence} |
| `src/lib/ocr/types.ts` | `ParsedIngredient`, `OcrResult`, … |
| `src/lib/ocr/constants.ts` | amount/unit regex, `INGREDIENT_SYNONYMS`, confidence thresholds |
| `src/lib/ocr/cache.ts` | in-memory `ocrCache` + cleanup |
| `src/config/upload.ts` | shared file validation (JPG/PNG, 5 MB) |
| `src/app/api/recipes/ocr/route.ts` | `POST` upload → spawn async → uploadId |
| `src/app/api/recipes/ocr/[uploadId]/route.ts` | `GET` poll (owner-only) |
| `src/components/recipe/PhotoUploadForm.tsx` | upload + polling UI |
| `src/components/recipe/OcrLoading.tsx` | processing state |
| `src/components/recipe/OcrReview.tsx` | review/correct + create recipe |

## 3. API

| Method | Path | Auth | Behaviour |
|---|---|---|---|
| POST | `/api/recipes/ocr` | required | validate file, start async OCR, return `{ uploadId, status }` |
| GET | `/api/recipes/ocr/[uploadId]` | required (owner) | return status; when complete, parsed/matched ingredients |

Recipe creation reuses `POST /api/recipes` — no new endpoint.

## 4. Test Strategy

- Unit: `src/__tests__/unit/ocr/parser.test.ts` (line parsing),
  `src/__tests__/unit/ocr/matcher.test.ts` (exact/fuzzy/no-match).
- Integration: `src/__tests__/integration/ocr/ocr-api.test.ts` (upload accepted,
  status polling) — smoke-level (tesseract is mocked).

## 5. Out of Scope / Notes

- The cache is in-memory (single-process); a shared store would be needed for
  multi-instance deployments. Not required at current scale.
- Photo storage/display on a saved recipe is **REQ-009**, not this REQ.

## 6. Related

REQ-014, REQ-009 (photo upload/display), REQ-012 (catalogue matched against),
ADR-008 (SQLite-only).
