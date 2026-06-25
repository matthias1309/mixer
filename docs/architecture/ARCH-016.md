# ARCH-016 — Recipe Metadata & REWE Tag Vocabulary

**Traces**: REQ-016
**Version**: 1.0
**Date**: 2026-06-25
**Status**: draft

---

## 1. Decision Summary

Scalar, single-valued attributes (`difficulty`, `total_time_minutes`,
`meal_type`) become **columns on `recipes`**. Multi-valued categories (Ernährung,
Hauptzutat, Ernährungsform, Backen, Anlässe) become a **normalised n:m
`recipe_tags` relation** rather than columns or a JSON blob, because REQ-017
needs to filter by individual tags efficiently (indexed `tag`) and a recipe can
carry several. The entire vocabulary is a **fixed allow-list in
`src/lib/constants.ts`**, the single source of truth for validation, the form,
and the later filter UI — no free-text tags (prevents filter drift).

```
recipes  ─1───n─  recipe_tags
  + difficulty        recipe_id (FK, cascade)
  + total_time_minutes  tag       (∈ TAG_VOCABULARY)
  + meal_type        UNIQUE(recipe_id, tag), INDEX(tag)
```

## 2. Data Model

**Migration `011` (additive only):**

```sql
ALTER TABLE recipes ADD COLUMN difficulty TEXT;            -- easy|medium|hard
ALTER TABLE recipes ADD COLUMN total_time_minutes INTEGER; -- nullable
ALTER TABLE recipes ADD COLUMN meal_type TEXT;             -- ∈ MEAL_TYPES

CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id INTEGER NOT NULL,
  tag       TEXT    NOT NULL,
  PRIMARY KEY (recipe_id, tag),
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag);
```

Existing recipes keep NULL metadata and zero tags (AC-016-05). Enum/value
validity is enforced in the app layer against the constants (SQLite has no native
enum), and the PK gives the per-recipe tag uniqueness (AC-016-04).

## 3. Vocabulary (single source of truth)

`src/lib/constants.ts` — copied 1:1 from REWE:

| Constant | Values |
|---|---|
| `DIFFICULTY_LEVELS` | `easy`, `medium`, `hard` (labels: Geringer/Mittlerer/Hoher Aufwand) |
| `MEAL_TYPES` | Vorspeise, Hauptspeise, Dessert, Beilagen, Frühstück, Suppen, Auflauf, Snacks, Getränke |
| `TAG_GROUPS.ernaehrung` | Fleisch, Fisch, Vegetarisch, Vegan |
| `TAG_GROUPS.hauptzutat` | Nudeln/Pasta, Kartoffeln, Reis, Gemüse, Kürbis |
| `TAG_GROUPS.ernaehrungsform` | Laktosefrei, Low Carb, Glutenfrei, Paleo, Wenig Zucker, Clean Eating |
| `TAG_GROUPS.backen` | Kuchen, Torten, Brot, Muffins, Cupcakes, Plätzchen |
| `TAG_GROUPS.anlaesse` | Frühling, Grillen, Picknick, Kindergerichte, Geburtstag, Party, günstig |

`TAG_VOCABULARY` = flattened set of all `TAG_GROUPS` values, used to validate
incoming tags.

## 4. Components Touched

| File | Role |
|---|---|
| `src/lib/db/migrations/011_*.sql` | schema above |
| `src/lib/constants.ts` | vocabulary + helper `isValidTag` / `isValidDifficulty` / `isValidMealType` |
| `src/types/recipe.ts` | extend `Recipe`, `RecipeListItem`, `CreateRecipeRequest`, `UpdateRecipeRequest` |
| `src/lib/db/models/recipe*.ts` | persist/read columns + tags (insert/replace tag rows on create/update) |
| `src/lib/validation.ts` | validate difficulty/mealType/time/tags against the allow-list |
| `src/app/api/recipes/route.ts` + `[id]/route.ts` | accept & validate new fields (HTTP 400 on invalid) |
| `src/components/forms/RecipeForm.tsx` | effort/time/meal-type inputs + multi-select tags |
| `src/components/RecipeCard.tsx` | render time/effort in meta row + tag chips (slot from ARCH-015) |

## 5. API

`POST /api/recipes` and `PUT /api/recipes/[id]` gain optional
`difficulty`, `totalTimeMinutes`, `mealType`, `tags: string[]`. List/detail
responses gain the same fields (tags as an array). Invalid enum/tag ⇒ 400
(AC-016-07); non-positive time ⇒ 400 (AC-016-08). Contract stays
backwards-compatible (all new fields optional).

## 6. Test Strategy

- Unit: `validation` (valid/invalid difficulty, meal type, tag, time), `constants`
  (vocabulary shape).
- Model: `recipe` model persists & reads metadata and tags; updating tags
  replaces the set; cascade delete removes tag rows.
- API: create/update accepts valid metadata, rejects out-of-vocabulary values
  (400); list response carries tags/time/effort.
- Component: `RecipeForm` renders & submits the new inputs; `RecipeCard` shows
  time/effort/tags when present and omits them when absent.

## 7. Out of Scope / Notes

- Filtering/sorting by these fields: REQ-017.
- Migration `011` is reviewed before production (CLAUDE.md).

## 8. Related

REQ-016, ARCH-015 (tag slot / RecipeImage), ARCH-017 (filters consume this),
ADR-008 (SQLite-only).
