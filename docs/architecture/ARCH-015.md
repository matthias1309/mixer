# ARCH-015 — REWE-Style Layout & Recipe Card Redesign

**Traces**: REQ-015
**Version**: 1.0
**Date**: 2026-06-25
**Status**: draft

---

## 1. Decision Summary

A **presentation-only** change. No database, no API contract change. We
introduce design tokens centrally (Tailwind theme + a few `globals.css`
utilities) so the reskin and all later redesign stories (REQ-016–018) reference
named colours instead of `blue-*` literals. The dashboard is restructured into
**search bar + left `FilterPanel` + card grid + numbered pagination**, reusing
the existing `PhaseFilter` and `IngredientFilter` as the first two filter groups.
A new `RecipeImage` component centralises the real-photo-vs-gradient-placeholder
decision so the grid never renders an empty card.

```
dashboard/page
 ├── SearchBar (new, drives existing `search` param)
 ├── FilterPanel (new shell, collapsible groups)
 │     ├── PhaseFilter   (existing — first, emphasised)  ← cycle phase stays
 │     └── IngredientFilter (existing)
 └── RecipeList
       ├── results counter + RecipeCard grid
       │     └── RecipeCard → RecipeImage (photo | gradient fallback)
       └── Pagination (numbered)
```

## 2. Components Touched

| File | Role |
|---|---|
| `tailwind.config.*` | new `brand` / `accent` / `surface` / `ink` colour tokens, radius/shadow |
| `src/app/globals.css` | button/badge/card utility classes on the tokens |
| `src/components/RecipeImage.tsx` | **new** — decides photo vs. deterministic gradient placeholder |
| `src/components/RecipeCard.tsx` | image-first layout, tag-chip slot, meta row, score badge |
| `src/components/FilterPanel.tsx` | **new** — collapsible group shell + "Filter zurücksetzen" |
| `src/components/Pagination.tsx` | numbered page links |
| `src/app/dashboard/page.tsx` | new layout, search bar, FilterPanel composition |
| `src/components/RecipeList.tsx` | results counter, grid spacing, token colours |
| `src/components/Navigation.tsx` | swap `blue-*` for tokens |

## 3. Key Designs

**Gradient placeholder (deterministic).** `RecipeImage` hashes the recipe `id`
to an index, picks a fixed gradient pair from the palette, and renders a div at
the same aspect ratio as a real image with a centred icon + the recipe name as
overlay (also the `aria-label`). Same id ⇒ same gradient (pure function, no
randomness) so the UI is stable across renders and SSR/CSR.

**Tag slot now, tags later.** `RecipeCard` accepts an optional `tags?: string[]`
and renders chips only when non-empty. REQ-015 always passes empty/undefined;
REQ-016 fills it. This keeps the card contract stable across stories.

**Tokens, not a rewrite.** Only colour/spacing classes change; the data flow
(`phase`, `minScore`, `selectedIngredients` → `RecipeList`) is untouched
(AC-015-13).

## 4. API

No change. Same `GET /api/recipes` params (`page`, `ingredients`, `phase`,
`search`, `sort`).

## 5. Test Strategy

- Component: `RecipeImage.test.tsx` (photo when `imagePath` set; deterministic
  gradient + name when null), `RecipeCard.test.tsx` (image-first order, empty tag
  slot, score badge), `Pagination.test.tsx` (numbered links, active page),
  `FilterPanel.test.tsx` (collapse, reset clears filters, phase group first).
- Regression: existing `RecipeList`/`PhaseFilter`/`IngredientFilter` tests must
  stay green (unchanged behaviour).

## 6. Out of Scope / Notes

- New filter data and engine: REQ-016 / REQ-017.
- The token names are reused by all later redesign stories — chosen once here.

## 7. Related

REQ-015, ARCH-016 (consumes the tag slot & RecipeImage), MAINT-003 (base path).
