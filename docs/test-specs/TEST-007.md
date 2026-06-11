# TEST-007 — Skeleton Loader & Zutatenfilter-Suche

**Status:** draft
**Created:** 2026-06-11
**Traces:** ARCH-007
**Verifies:** REQ-007 (AC-007-01, AC-007-02)

## Test Cases

### TC-007-01 — Skeleton cards shown while loading

**Maps to:** AC-007-01 | **Type:** unit | **File:** `src/__tests__/components/RecipeList.skeleton.test.tsx`

```gherkin
Given the recipe list is fetching data
When isLoading is true
Then animate-pulse skeleton cards are rendered instead of a text spinner
And exactly 3 skeleton cards are shown
```

---

### TC-007-02 — Ingredient filter search narrows list

**Maps to:** AC-007-02 | **Type:** unit | **File:** `src/__tests__/components/IngredientFilter.search.test.tsx`

```gherkin
Given the ingredient filter shows a list of ingredients
When the user types in the search field
Then only matching ingredients are visible
And clearing the field restores the full list
```
