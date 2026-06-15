# Code Review: REQ-009 — Recipe Photo

**Date**: 2026-06-15
**Reviewer**: Claude Code
**Status**: ✅ APPROVED (with minor follow-ups noted)
**Branch**: `claude/magical-turing-v30hka`
**PR**: #25

---

## Summary

Adds an optional photo to a recipe. The photo is uploaded on the create
(`/recipes/new`) and edit (`/recipes/[id]/edit`) forms and shown on the
dashboard cards in place of the description (with a graceful fallback to
the description when no photo exists). Implemented per the V-Model
sequence: REQ-009 → ARCH-009 → TEST-009 → tests → implementation.

**Scope / risk**: Low–medium. One additive, nullable DB column; one new
endpoint; no change to the recipe JSON create/update contract. Binaries
live on disk, not in the DB.

---

## Files Created / Modified

| File | Change |
|---|---|
| `src/lib/db/migrations/010_add_recipe_image.sql` | new — nullable `image_path` column |
| `src/lib/recipes/image-storage.ts` | new — save/read/path/content-type helpers |
| `src/app/api/recipes/[id]/image/route.ts` | new — `POST` (owner-only upload), `GET` (public serve) |
| `src/app/api/recipes/[id]/route.ts` | detail GET returns `imagePath` |
| `src/lib/db/models/recipe-async.ts` | `setImage()`; `imagePath` in list queries (SQLite + PG) |
| `src/lib/db/models/recipe.ts` | `imagePath` in list/filter queries (SQLite + PG) |
| `src/types/recipe.ts` | `image_path` on `Recipe`; `imagePath` on `RecipeListItem` |
| `src/components/forms/RecipeForm.tsx` | file input + preview; upload after save |
| `src/components/RecipeCard.tsx` | render photo instead of description |
| `src/app/recipes/[id]/edit/page.tsx` | pass current `imagePath` |
| `docs/{requirements,architecture,test-specs}/*-009.md` | V-Model artifacts |

---

## SOLID Principles

- **SRP**: Filesystem concerns isolated in `image-storage.ts`; the route
  stays thin (auth → validate → delegate). DB access stays in the models.
- **OCP**: New behaviour added via a new endpoint and a new column rather
  than by mutating the existing recipe JSON contract.
- **DIP**: Route depends on the storage helper and model abstractions,
  not on `fs` paths directly (except the read in the serve handler, which
  is acceptable for streaming bytes back).

## Clean Code (DRY / KISS / YAGNI)

- **DRY**: Reuses `getValidationError()` and `UPLOAD_CONFIG` from
  `src/config/upload.ts` rather than re-deriving the JPG/PNG + 5 MB rules.
- **KISS**: Upload-after-save flow keeps the create/update API untouched.
- **YAGNI**: One photo per recipe; no thumbnailing or multi-image support
  (explicitly out of scope in ARCH-009).

---

## Acceptance Criteria

| AC | Status | Evidence |
|---|---|---|
| AC-009-01 valid image persisted on create | ✅ | TC-009-01 |
| AC-009-02 invalid type/size rejected | ✅ | TC-009-05 + client guard |
| AC-009-03 replace on edit | ✅ | TC-009-02 |
| AC-009-04 owner-only / 401 unauth | ✅ | TC-009-03, TC-009-04 |
| AC-009-05 serve with correct Content-Type | ✅ | TC-009-06 |
| AC-009-06 404 when no photo | ✅ | TC-009-07 |
| AC-009-07 card shows image | ✅ | RecipeCard + TC-009-08 |
| AC-009-08 fallback to description | ✅ | RecipeCard conditional |
| AC-009-09 lint / type-check / tests pass | ✅ | see below |

---

## Code Quality

```
npx tsc --noEmit   → 0 errors
npm run lint       → 0 warnings (--max-warnings=0)
npm test           → 56 suites, 447 tests passing (8 new)
```

Coverage of the new endpoint is exercised by the 8-case
`image.test.ts` suite (owner upload, replace, 403, 401, 400 invalid type,
serve content-type, 404, list field).

---

## Review Findings

A 7-angle adversarial review (correctness line-scan, removed-behavior,
cross-file tracer, reuse, simplification, efficiency, altitude) was run.
Most candidates were refuted (e.g. an alleged XSS via recipe id — the id
is a numeric value from the API, not arbitrary input; an alleged missing
`imagePath` in the PG SELECT — it is present). Three actionable findings
were confirmed and **fixed in this branch**:

1. **Cleanup failure could fail a successful request** — `deleteRecipeImage`
   ran inside the upload `try` block after the DB was already updated; a
   `unlinkSync` error (locked file / permissions) would surface as a 500
   despite the upload succeeding. Fixed: deletion errors are now caught,
   logged, and swallowed inside the helper.
2. **Object-URL memory leak** — `URL.createObjectURL` previews were never
   revoked. Fixed: a `useEffect` cleanup revokes the blob URL on change
   and unmount.
3. **Path-traversal hardening** — `getRecipeImagePath` now applies
   `path.basename()` so a corrupted/forged `image_path` cannot escape the
   upload directory. (Filenames are server-generated, so this is
   defence-in-depth.)

### Known follow-ups (non-blocking)

- **Partial success on upload failure**: the recipe is saved as JSON
  first, then the photo is uploaded. If the photo upload fails, the user
  sees an error and is not redirected; a create retry relies on the
  existing name+ingredients de-duplication to avoid a true duplicate.
  Acceptable for REQ-009; a future improvement could surface "recipe
  saved, photo failed — retry photo" instead of a generic error.
- **No delete-photo endpoint**: replace-on-upload only (per ARCH-009 §8).
- **Orphaned file on rare mid-request failure**: if `setImage` throws
  after the file is written, the new file is orphaned on disk (no DB
  reference). Low impact; a periodic sweep could be added if it matters.

---

## Key Decisions

1. **Filesystem storage, file name in DB** — keeps the DB small and
   matches the existing `UPLOAD_CONFIG`/OCR convention.
2. **Dedicated `/api/recipes/[id]/image` endpoint** — preserves the
   widely-tested recipe JSON contract; mirrors the OCR upload pattern.
3. **`apiUrl()` for image src** — base-path-safe for the `/rezepte`
   production sub-path (MAINT-003).
4. **`imagePath` surfaced in all list queries (sync + async, SQLite + PG)**
   — so dashboard cards render photos on both the default and
   ingredient-filtered paths without an extra round-trip.

---

## Signature

✅ **Approved for merge.** Implementation meets all acceptance criteria,
passes lint/type-check/tests, and the three confirmed review findings are
fixed. Remaining items are documented, non-blocking follow-ups.
