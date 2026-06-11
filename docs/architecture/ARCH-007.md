# ARCH-007 — Skeleton Loader & Zutatenfilter-Suche

**Status:** draft
**Created:** 2026-06-11
**Traces:** REQ-007
**Verified by:** _(pending TEST-SPEC)_

## Summary

Two purely frontend changes. No new API endpoints or data model changes.

## Design

### AC-007-01: Skeleton loading state

**File:** `src/components/RecipeList.tsx`

Replace the `isLoading` branch text with 3 skeleton cards:

```tsx
// current
if (isLoading) return <div>Rezepte werden geladen...</div>;

// new
if (isLoading) return <RecipeListSkeleton />;
```

`RecipeListSkeleton` is an inline function component (not a separate file — YAGNI) returning:

```
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {[1,2,3].map(i => (
    <div key={i} className="bg-white p-4 rounded-lg shadow animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />   ← title
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />   ← creator
      <div className="h-4 bg-gray-200 rounded w-full mb-1" />  ← description line 1
      <div className="h-4 bg-gray-200 rounded w-5/6 mb-4" />   ← description line 2
      <div className="h-3 bg-gray-200 rounded w-1/2" />        ← meta
    </div>
  ))}
</div>
```

---

### AC-007-02: Ingredient filter search

**File:** `src/components/IngredientFilter.tsx`

New local state:
```typescript
const [search, setSearch] = useState('');
```

The full ingredient list is filtered before rendering:
```typescript
const visibleIngredients = ingredients.filter(name =>
  name.toLowerCase().includes(search.toLowerCase())
);
```

A search input is rendered above the checkbox list:
```
<input
  type="text"
  placeholder="Zutaten suchen..."
  value={search}
  onChange={e => setSearch(e.target.value)}
/>
```

The `selectedIngredients` state and `toggleIngredient` / `clearFilters` logic are unchanged.
A selected ingredient hidden by the search filter remains selected.

## Key Decisions

- **Inline skeleton component** — one use case, no shared abstraction needed.
- **Client-side search** — the ingredient list is already loaded in memory; an API call would be wasteful.
- **Tailwind `animate-pulse`** — no animation library dependency for a single use case.

## Out of Scope

- Skeleton for the ingredients master list page
- Animated skeleton shimmer (beyond Tailwind pulse)
- Recipe photo support (requires DB migration — out of scope per CLAUDE.md)
