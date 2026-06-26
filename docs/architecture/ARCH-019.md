# ARCH-019 — Configurable Recipe Page Size

**Status:** Implemented — documented retroactively
**Created:** 2026-06-26
**Traces:** REQ-019
**Verified by:** TEST-019

## Summary

Adds a page-size selector to the dashboard so the user can choose how many
recipes are fetched per page (10/20/50/100, default 10), instead of the
fixed value of 10 introduced by REQ-015. The change is UI-only — the API's
`pageSize` query parameter and its clamping (1–100) already existed
(`src/app/api/recipes/route.ts`, REQ-015) and required no modification.

## Design

```
DashboardPage (state: pageSize)
  ├─ PageSizeDropdown   value={pageSize} onChange={setPageSize}
  ├─ SortDropdown       (unrelated, rendered alongside)
  └─ RecipeList         pageSize={pageSize} ...other filter props
        │
        ├─ useEffect: pageSize changes → setPage(1)
        ├─ buildUrl(): params.set('pageSize', pageSize)
        └─ GET /api/recipes?...&pageSize=<n>&page=<page>
              │
              └─ (pre-existing, REQ-015) clamp to [1,100], default 10
                 → { recipes, total, page, pageSize, totalPages }
```

Data flow:
1. `DashboardPage` owns `pageSize` as local component state (`useState(10)`),
   passed into `RecipeList` as a prop alongside the existing filter props
   (`phase`, `minScore`, `search`, `sort`).
2. `RecipeList` includes `pageSize` in its `buildUrl()` dependency array and
   query string, so any change triggers a re-fetch via the existing
   `useFetch` hook.
3. A dedicated `useEffect` in `RecipeList` resets `page` to `1` whenever
   `pageSize` changes, preventing a request for a now out-of-range page
   (e.g. user was on page 5 of size 10, switches to size 100).
4. `PageSizeDropdown` is a stateless, controlled `<select>` component,
   structurally identical to the existing `SortDropdown` (same prop shape:
   `value` + `onChange`).
5. The API route's existing parsing/clamping logic
   (`Math.min(100, Math.max(1, parseInt(...) || 10))`) is reused unchanged.

## Key Decisions

- **Component state, not URL/localStorage persistence**: page size resets to
  the default of 10 on reload. Chosen for simplicity (YAGNI) — no requirement
  for cross-session persistence was raised. Easy to extend later (e.g. via
  `localStorage`) without changing the component contract.
- **Fixed option set (10/20/50/100) instead of free input**: matches the
  existing `SortDropdown` UX pattern and avoids validating arbitrary numeric
  input client-side (the API already clamps server-side as a safety net).
- **Mirrors `SortDropdown` structurally**: keeps the dashboard's filter/sort
  controls visually and structurally consistent (Boy Scout Rule — reuse
  existing pattern over inventing a new one).
- **No API changes**: the `pageSize` query parameter and its clamping were
  already shipped as part of REQ-015's pagination engine; this story is
  purely about exposing that existing capability through the UI.

## Out of Scope

- Persisting the selected page size across sessions or per user
- Page sizes outside the fixed 10/20/50/100 set
- Changes to the `/api/recipes` route or its clamping behaviour

## Open Questions

None — implementation is complete and matches this design.
