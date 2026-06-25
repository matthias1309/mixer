# ARCH-018 — Recipe Star Ratings

**Traces**: REQ-018
**Version**: 1.0
**Date**: 2026-06-25
**Status**: draft

---

## 1. Decision Summary

Ratings are a normalised `recipe_ratings` table with **one row per (user,
recipe)** enforced by a DB uniqueness constraint, not just app code (AC-018-01,
AC-018-05). Aggregates (`AVG`, `COUNT`) are computed in SQL and joined into the
existing list/detail queries, so the card and the REQ-017 filter/sort can read
`ratingAverage` / `ratingCount` without a second round-trip. Submitting a rating
is an **upsert** (insert or update the caller's row). This closes the data gap
that REQ-017's `minRating` / `sort=rating` depend on.

```
recipe_ratings (user_id, recipe_id, stars 1..5)  UNIQUE(user_id, recipe_id)
        │  AVG(stars), COUNT(*)
        ▼
GET /api/recipes (+detail) ── join ─▶ ratingAverage (1 dp), ratingCount
POST/PUT rating ── upsert ─▶ caller's row
```

## 2. Data Model

**Migration `012`:**

```sql
CREATE TABLE IF NOT EXISTS recipe_ratings (
  user_id    INTEGER NOT NULL,
  recipe_id  INTEGER NOT NULL,
  stars      INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, recipe_id),
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe ON recipe_ratings(recipe_id);
```

The composite PK enforces one rating per user/recipe; the `CHECK` backs up the
1..5 app validation; the recipe index supports the aggregate join.

## 3. Components Touched

| File | Role |
|---|---|
| `src/lib/db/migrations/012_*.sql` | schema above |
| `src/types/recipe.ts` | add `ratingAverage: number \| null`, `ratingCount: number` to list/detail types |
| `src/lib/db/models/rating.ts` | **new** — `upsertRating(userId, recipeId, stars)`, `getUserRating`, aggregate helpers |
| `src/lib/db/models/recipe*.ts` | join `AVG`/`COUNT` into list/detail; add `minRating` predicate + `sort=rating` (completes ARCH-017) |
| `src/app/api/recipes/[id]/rating/route.ts` | **new** — `POST`/`PUT` (auth, 1..5), `GET` caller's rating |
| `src/components/recipe/StarRating.tsx` | **new** — interactive 1–5 control on detail page |
| `src/components/RecipeCard.tsx` | show "4.7 ★ (12)" or neutral empty state |
| `src/components/FilterPanel.tsx` | minimum-rating control (feeds REQ-017 `minRating`) |

## 4. API

| Method | Path | Auth | Behaviour |
|---|---|---|---|
| GET | `/api/recipes/[id]/rating` | required | caller's current stars (or null) |
| POST/PUT | `/api/recipes/[id]/rating` | required | upsert `stars` 1..5; 400 if out of range; 401 if anon |

List/detail responses gain `ratingAverage` (1 dp, null when none) and
`ratingCount`. `GET /api/recipes?minRating=N` and `?sort=rating` (ARCH-017)
become fully functional.

## 5. Test Strategy

- Model: upsert inserts then updates (no duplicate); aggregate returns avg/count;
  no-ratings recipe ⇒ null/0.
- API: authed rating stored; out-of-range ⇒ 400; anon ⇒ 401; re-rating updates.
- Integration: `minRating` excludes unrated & below-threshold recipes;
  `sort=rating` orders by avg desc; composes with phase/metadata filters.
- Component: `StarRating` reflects current rating & submits; `RecipeCard` shows
  aggregate vs. empty state.

## 6. Out of Scope / Notes

- Written reviews/comments; abuse prevention beyond the unique constraint.
- Migration `012` reviewed before production (CLAUDE.md).

## 7. Related

REQ-018, ARCH-017 (consumes minRating/sort=rating), ADR-008 (SQLite-only).
