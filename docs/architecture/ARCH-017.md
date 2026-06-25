# ARCH-017 — REWE-Style Filter & Sort Engine

**Traces**: REQ-017
**Version**: 1.0
**Date**: 2026-06-25
**Status**: draft

---

## 1. Decision Summary

Extend the **existing** `GET /api/recipes` rather than adding new endpoints, so
all filters compose in one paginated SQL query. New params (`difficulty`,
`maxTime`, `mealType`, `tags`, plus the REQ-018 `minRating`/`sort=rating`) are
parsed, validated against the REQ-016 vocabulary, and translated into
parameterised `WHERE` predicates. Unknown values are dropped (treated as
"not filtered", AC-017-04) so a stray param never 500s. Tag filtering is an
**AND** across requested tags (a recipe must carry all of them), implemented via
`GROUP BY ... HAVING COUNT(DISTINCT tag) = :n` on the indexed `recipe_tags`.
The `FilterPanel` from ARCH-015 gains the new collapsible groups, sourced from
the same constants.

```
FilterPanel (URL query state)
  phase ─┐
  ingredients ─┤
  difficulty ──┤──▶ GET /api/recipes?… ─▶ buildRecipeQuery() ─▶ single paginated SQL
  maxTime ─────┤                              (parameterised predicates + sort)
  mealType ────┤
  tags[] (AND) ┘
  sort dropdown ──────────────────────────▶ ORDER BY
```

## 2. Query Construction

A `buildRecipeQuery(filters)` helper in the recipe model assembles predicates:

| Param | Predicate |
|---|---|
| `phase` | existing scoring/phase logic (unchanged) |
| `ingredients` | existing ingredient-match logic (unchanged) |
| `difficulty` | `recipes.difficulty = :difficulty` (if in `DIFFICULTY_LEVELS`) |
| `maxTime` | `recipes.total_time_minutes IS NOT NULL AND <= :maxTime` |
| `mealType` | `recipes.meal_type = :mealType` (if in `MEAL_TYPES`) |
| `tags` (AND) | `id IN (SELECT recipe_id FROM recipe_tags WHERE tag IN (:tags) GROUP BY recipe_id HAVING COUNT(DISTINCT tag) = :tagCount)` |
| `minRating` | REQ-018 — `AVG(stars) >= :minRating` (join/subquery) |
| `sort` | `newest` (default existing), `time` (`total_time_minutes ASC NULLS LAST`), `rating` (avg DESC; falls back to default until REQ-018 lands) |

All values are **bound parameters** — no string interpolation of user input.
Only the *shape* (which predicates are present) is built dynamically.

## 3. Components Touched

| File | Role |
|---|---|
| `src/lib/constants.ts` | `RECIPE_SORT_OPTIONS` extended (`time`, `rating`); validation helpers (REQ-016) reused |
| `src/lib/db/models/recipe*.ts` | `buildRecipeQuery()` + extend `listAllWithScoreAsync` / ingredient-filter path to accept the new filters |
| `src/app/api/recipes/route.ts` | parse/validate new query params, pass to model, ignore invalid (no 500) |
| `src/components/FilterPanel.tsx` | new collapsible groups (Ernährung, Hauptzutat, Ernährungsform, Backen, Anlässe, Aufwand, max-time) |
| `src/components/SortDropdown.tsx` | **new** — drives `sort` |
| `src/components/RecipeList.tsx` | thread new filter + sort state into the query string |
| `src/hooks/useFilter.ts` | hold the extended filter state (and reflect in URL where practical) |

## 4. API

`GET /api/recipes` — new optional query params: `difficulty`, `maxTime`,
`mealType`, `tags` (comma-separated, AND), `sort` (extended set). Response shape
unchanged (`recipes`, `total`, `page`, `pageSize`, `totalPages`). Backwards
compatible: omitting all new params reproduces today's behaviour.

## 5. Test Strategy

- Unit: `buildRecipeQuery` produces the expected predicate set per filter combo;
  unknown values are dropped; tags use AND (HAVING count).
- Integration (real in-memory SQLite, seeded recipes+tags): each filter narrows
  correctly; filters compose with `phase` + `ingredients`; `sort=time` orders by
  time; invalid param is ignored (200, not 500).
- Component: `FilterPanel` renders the new groups, multi-select updates state,
  "Filter zurücksetzen" clears everything incl. new groups; `SortDropdown` drives
  the param.

## 6. Out of Scope / Notes

- `minRating` / `sort=rating` data is produced by REQ-018; until then `rating`
  sort degrades to the default ordering (documented, not an error).

## 7. Related

REQ-017, ARCH-016 (metadata source), ARCH-018 (rating filter/sort), ADR-008.
