# Feature Map

A navigation + impact aid for changing features safely. For each feature it
lists the **REQ/ticket**, the **key files**, and the **dependency edges**
("depends on" / "used by"). The last section lists the **shared seams** — files
and tables that several features touch, i.e. the places where a change is most
likely to break something else.

> **How to use this map**
> 1. Find the feature you're changing → read its REQ/ARCH/TEST and key files.
> 2. Check **Used by** — those features can break if you change shared behaviour.
> 3. Check the **Shared seams** table — if you're editing one of those files,
>    assume multiple features are affected.
> 4. **Run the test suite** (CI runs it on every PR). This map is the map; the
>    tests are the safety net. Treat the code + tests as ground truth — docs can
>    drift.
>
> Keep this file updated when adding a feature or moving a major file. Run
> `/traceability` for the REQ↔ARCH↔TEST coverage matrix.

---

## Core features

| Feature | REQ / ticket | Key files | Depends on | Used by / Affects |
|---|---|---|---|---|
| **Auth & Users** | `requirements/mvp/01`, USR-101…107, ADR-001 | `src/lib/auth/{jwt,middleware,password,tokenRefresh,rateLimiter}.ts`, `src/app/api/auth/*`, `src/contexts/AuthContext.tsx`, `src/lib/db/models/user.ts` | DB layer | **Every mutating endpoint** (owner checks), Cycle (010) |
| **Recipe CRUD** | `requirements/mvp/02`, REC-101…108 | `src/lib/db/models/recipe.ts`, `recipe-async.ts`, `src/app/api/recipes/route.ts` + `[id]/route.ts`, `src/components/forms/RecipeForm.tsx` | Auth, DB layer | Filtering, Scoring (011), Nutrition (012), Photo (009), OCR (014), Scaling (013) |
| **Ingredient Filtering** | `requirements/mvp/03`, FLT-101…107 | `src/components/IngredientFilter.tsx`, `src/contexts/FilterContext.tsx`, `RecipeModelAsync.getUniqueIngredients()` | Recipe CRUD | Dashboard listing |
| **Public Read Access** | REQ-004, ADR-007 | GET handlers in `src/app/api/recipes/*`, `nutrition/*`, `ingredients-master/*` (no auth on reads) | Auth (inverse) | All public GET routes |
| **UX: Phase 1 / Mobile nav & delete / Skeleton & filter search** | REQ-005 / REQ-006 / REQ-007 | `src/components/{Navigation,RecipeList,IngredientFilter,PhaseFilter}.tsx`, `src/app/recipes/[id]/page.tsx`, `src/hooks/useWakeLock.ts` | Recipe CRUD, Filtering | Frontend only (no API/data change) |
| **Recipe Photo (upload/display)** | REQ-009 / ARCH-009 / TEST-009 | `src/app/api/recipes/[id]/image/route.ts`, `src/lib/recipes/image-storage.ts`, `src/config/upload.ts`, `RecipeForm.tsx`, `RecipeCard.tsx`, migration `010_add_recipe_image.sql` | Recipe CRUD, upload config | Dashboard cards |
| **Menstrual Cycle Tracking** | REQ-010 / ARCH-010 / TEST-010 | `src/lib/cycle/*`, `src/app/api/users/cycle/route.ts`, `UserModel.saveCycle/getCycle`, `src/components/cycle/*`, migration `003_create_user_cycles.sql` | Auth | Cycle Scoring (011) — provides the current phase |
| **Cycle-Based Recipe Scoring** | REQ-011 / ARCH-011 / TEST-011 | `src/lib/scoring/phaseScore.ts`, `RecipeModelAsync.listAllWithScoreAsync()`, `src/app/api/recipes/route.ts` (`?phase=`), `src/lib/constants.ts` | Cycle (010) for the phase, **Nutrition (012)** for aggregates, Recipe CRUD | Dashboard ranking |
| **Nutrition DB & Calculation** | REQ-012 / ARCH-012 / TEST-012 (+ REQ-008 endpoint fix) | `src/lib/nutrition/*`, `ingredientMasterAsync.ts`, `RecipeModelAsync.getNutrients()`, `src/app/api/{nutrition/ingredients,ingredients-master,recipes/[id]/calculate}/*`, migrations `002`,`004`,`005` | Recipe CRUD, `ingredients_master` | **Cycle Scoring (011)**, OCR matching (014), nutrient display |
| **Unit Conversion & Recipe Scaling** | REQ-013 / ARCH-013 / TEST-013, ADR-006 | `src/lib/units/*`, `src/app/api/recipes/[id]/scale/route.ts`, ingredient normalisation in `recipes/[id]/ingredients/route.ts`, migrations `006`–`009`, `src/db/seeds/units.ts` | DB seeds | Recipe scaling UI, ingredient add |
| **Recipe Photo OCR & Extraction** | REQ-014 / ARCH-014 / TEST-014 | `src/lib/ocr/*`, `src/app/api/recipes/ocr/*`, `src/components/recipe/{PhotoUploadForm,OcrReview,OcrLoading}.tsx`, `src/config/upload.ts` | **Nutrition (012)** for matching, Recipe CRUD for create, upload config | Recipe creation from photo |
| **REWE Redesign: Layout & Cards** | REQ-015 / ARCH-015 / TEST-015 | `tailwind.config.*`, `src/app/globals.css`, `src/components/{RecipeImage,RecipeCard,FilterPanel,Pagination,RecipeList,Navigation}.tsx`, `src/app/dashboard/page.tsx` | Recipe CRUD, Filtering, Phase filter | Provides design tokens + card/filter shell to 016/017/018 (presentation only, no DB change) |
| **REWE Redesign: Metadata & Tags** | REQ-016 / ARCH-016 / TEST-016 | migration `011`, `src/lib/constants.ts` (vocabulary), `recipe_tags` table, `src/lib/db/models/recipe*.ts`, `src/lib/validation.ts`, `src/types/recipe.ts`, `RecipeForm.tsx`, `RecipeCard.tsx`, `src/app/api/recipes/{route,[id]/route}.ts` | REQ-015 (tag slot/card), Recipe CRUD | **Filter Engine (017)**, card chips/meta |
| **REWE Redesign: Filter & Sort Engine** | REQ-017 / ARCH-017 / TEST-017 | `buildRecipeQuery()` in `recipe*.ts`, `src/app/api/recipes/route.ts`, `src/components/{FilterPanel,SortDropdown,RecipeList}.tsx`, `src/hooks/useFilter.ts`, `src/lib/constants.ts` | REQ-016 (metadata), Phase + Ingredient filters | Dashboard filtering/sorting |
| **REWE Redesign: Star Ratings** | REQ-018 / ARCH-018 / TEST-018 | migration `012`, `recipe_ratings` table, `src/lib/db/models/rating.ts`, `recipe*.ts` (aggregate join), `src/app/api/recipes/[id]/rating/route.ts`, `src/components/{recipe/StarRating,RecipeCard,FilterPanel}.tsx` | Auth, Recipe CRUD | Filter Engine (017) `minRating`/`sort=rating`, card rating display |

---

## Shared seams — change here = high regression risk

These are touched by **multiple** features. Editing one means re-checking every
feature in the "Features affected" column (and running their tests).

| Seam (file / table) | Features affected |
|---|---|
| `src/lib/db/models/recipe-async.ts` | Recipe CRUD, **Scoring (011)** (`listAllWithScoreAsync`), **Nutrition (012)** (`getNutrients`), **Photo (009)** (`setImage`), Filtering (`getUniqueIngredients`) |
| `src/app/api/recipes/route.ts` (list) | Recipe CRUD, Filtering, **Scoring (011)** (`?phase=`), search/sort, **Filter Engine (017)** (difficulty/maxTime/mealType/tags/minRating/sort), **Ratings (018)** |
| `src/components/{RecipeCard,FilterPanel}.tsx` | Redesign (015), Metadata chips/meta (016), Filter groups (017), Rating display/min-rating (018) |
| `recipe_tags` table | Metadata (016) writes, **Filter Engine (017)** reads (AND tag filter) |
| `ingredients_master` table | Nutrition (012), Scoring (011), OCR matching (014), ingredient autocomplete |
| `src/lib/db/init.ts` | **All features** — engine, migration runner, seeding (ADR-008 SQLite-only) |
| `src/lib/auth/middleware.ts` | **All protected/mutating endpoints** |
| `src/components/forms/RecipeForm.tsx` | Recipe CRUD, Photo upload (009), ingredient autocomplete |
| `src/config/upload.ts` | Photo (009) **and** OCR (014) share file validation |
| `src/lib/constants.ts` | Scoring (011) phases, recipe sort/filter options, **REWE tag vocabulary / difficulty / meal types (016)**, **extended sort options (017)** |
| `src/components/forms/RecipeForm.tsx` (also a seam below) | Recipe CRUD, Photo (009), autocomplete, **Metadata inputs (016)** |
| migrations `src/lib/db/migrations/*.sql` | schema changes ripple to every model/query that reads the table |

---

## Cross-cutting concerns

- **Database**: SQLite only (ADR-008). All access is raw SQL via
  `better-sqlite3`; see `src/lib/db/init.ts` and `arc42.md` §4/§8.
- **Auth**: JWT in httpOnly cookies with refresh rotation (ADR-001).
- **Base path**: production runs under `/rezepte`; client URLs must use
  `apiUrl()` / `next/link` (MAINT-003) — a frequent source of subtle breakage.
- **Deployment**: Uberspace + GitHub Actions (`docs/deployment/`).

---

## Maintenance

- Update the relevant row when you add/rename a feature or move a key file.
- If a change crosses a **Shared seam**, say so in the PR and make sure the
  affected features' tests run.
- Authoritative sources: the V-Model docs (`requirements/`, `architecture/`,
  `test-specs/`), ADRs (`decisions/`), and ultimately the code + tests.
