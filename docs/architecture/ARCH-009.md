# ARCH-009 — Recipe Photo

**Traces**: REQ-009
**Version**: 1.0
**Date**: 2026-06-15
**Status**: draft

---

## 1. Decision Summary

A recipe gains an optional `image_path` column holding the **file name**
of a photo stored on disk under `.data/uploads/recipes/`
(`UPLOAD_CONFIG.UPLOAD_DIR`). The binary never enters the database. The
photo is uploaded through a dedicated, focused endpoint
`POST /api/recipes/[id]/image` and served back through
`GET /api/recipes/[id]/image`. The existing JSON create/update contract
for recipes is left untouched.

## 2. Why a separate image endpoint

The recipe create/update API is JSON-based and widely tested. Mixing a
multipart file upload into it would change its contract and complicate
validation. The codebase already uses a dedicated multipart endpoint for
the OCR feature (`POST /api/recipes/ocr`), so a focused
`POST /api/recipes/[id]/image` follows an established pattern and keeps
the recipe JSON contract stable.

Upload flow (client, `RecipeForm`):

1. Submit recipe as JSON (`POST /api/recipes` or `PUT /api/recipes/[id]`)
   — unchanged.
2. If the user picked a new image, `POST` it as `multipart/form-data` to
   `/api/recipes/{id}/image` using the id returned in step 1.
3. Redirect to the recipe detail page.

This works identically for create and edit, and the recipe always exists
by the time the image is uploaded (id is known).

## 3. Data Model

New migration `src/lib/db/migrations/010_add_recipe_image.sql`:

```sql
ALTER TABLE recipes ADD COLUMN image_path VARCHAR(255);
```

Idempotency and SQLite/PostgreSQL compatibility are handled by the
migration runner (`src/lib/db/init.ts`), which skips duplicate-column
errors on `ALTER TABLE ... ADD COLUMN` — same approach as migrations 004
and 009.

`image_path` stores only the file name, e.g. `recipe-3-<uuid>.jpg`. The
absolute path is rebuilt at read time as
`path.join(process.cwd(), UPLOAD_CONFIG.UPLOAD_DIR, image_path)`.

## 4. Components Touched

| File | Change |
|---|---|
| `src/lib/db/migrations/010_add_recipe_image.sql` | new — add `image_path` |
| `src/types/recipe.ts` | `image_path` on `Recipe`; `imagePath` on `RecipeListItem` |
| `src/lib/db/models/recipe-async.ts` | `setImage()`; select `image_path` → `imagePath` in list queries |
| `src/app/api/recipes/[id]/image/route.ts` | new — `POST` (owner-only upload), `GET` (public serve) |
| `src/app/api/recipes/[id]/route.ts` | GET detail returns `imagePath` |
| `src/lib/recipes/image-storage.ts` | new — save/read/path helpers around `UPLOAD_CONFIG` |
| `src/components/forms/RecipeForm.tsx` | file input + preview; upload after save |
| `src/components/RecipeCard.tsx` | render image instead of description when present |

## 5. Image Storage Helper

`src/lib/recipes/image-storage.ts` centralises filesystem concerns
(keeps the route thin, per CLAUDE.md "business logic lives in `src/lib/`"):

- `saveRecipeImage(recipeId, file): Promise<string>` — writes the buffer
  to `UPLOAD_CONFIG.UPLOAD_DIR`, returns the stored file name. Creates the
  directory if missing.
- `getRecipeImagePath(fileName): string` — resolves the absolute path.
- `contentTypeFor(fileName): string` — maps extension to
  `image/png` / `image/jpeg`.

## 6. Serving & Base Path

`GET /api/recipes/[id]/image` is public (the recipe list/detail GETs are
already public reads). The dashboard card builds its `<img src>` with
`apiUrl('/api/recipes/{id}/image')` so it respects the production
sub-path. The card only renders the image when the list response includes
a truthy `imagePath`, avoiding a 404 round-trip for photo-less recipes.

## 7. Test Strategy

- Model/API unit tests follow the per-file SQLite db pattern from
  `src/__tests__/unit/api/recipes/crud.test.ts`.
- New test file `src/__tests__/unit/api/recipes/image.test.ts` covers
  upload auth/ownership/validation, the stored `image_path`, the serve
  route, and the 404-when-absent case, plus that `listAllWithScoreAsync`
  surfaces `imagePath`.

## 8. Out of Scope

- Multiple photos per recipe (one photo only).
- Image resizing / thumbnail generation (served as uploaded).
- A dedicated delete-photo endpoint (replace-on-upload is sufficient for
  REQ-009; deletion can be a follow-up).

## 9. Related Decisions

- REQ-009, MAINT-003 (base-path-aware URLs), `src/config/upload.ts`
