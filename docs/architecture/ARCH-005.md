# ARCH-005 — UX/UI Verbesserungen Phase 1

**Status:** draft
**Created:** 2026-06-11
**Traces:** REQ-005
**Verified by:** TEST-005

## Summary

Pure frontend refactoring of four existing components and pages to improve usability.
No new API endpoints, no database changes, no new components — only structural and visual changes
to existing files.

## Design

### AC-005-01: Recipe detail — logical content order

**File:** `src/app/recipes/[id]/page.tsx`

Current order:
```
title/actions → description → servings+ingredients → nutrients → instructions
```

New order:
```
title/actions → description → servings+ingredients → instructions → nutrients (collapsed)
```

New local state:
```typescript
const [isNutrientsOpen, setIsNutrientsOpen] = useState(false);
```

The nutrients section is wrapped in a collapsible container controlled by `isNutrientsOpen`.
A button/header toggles visibility. State does not persist across page loads.

---

### AC-005-02: Dashboard — CTA hierarchy

**File:** `src/app/dashboard/page.tsx`

The four action buttons move from below the recipe list to above it (between the `<h1>` and
the filter/recipe grid). Visual hierarchy:

| Button | Style |
|---|---|
| Rezept erstellen | Primary — solid filled (e.g. `bg-blue-600`) |
| Aus Foto hochladen | Secondary — outlined (`border border-blue-600 text-blue-600`) |
| Zyklus verfolgen | Secondary — outlined |
| Zutaten verwalten | Secondary — outlined |

All four buttons use the same size and font. Only fill vs. outline differentiates priority.
Rainbow colors (green/pink/purple) are removed in favour of a single blue palette.

---

### AC-005-03: Phase filter — chips

**File:** `src/components/recipe/PhaseFilter.tsx`

The `<select>` element is replaced with four `<button>` elements rendered as horizontal chips.
The `onFilterChange` prop interface remains unchanged.

```
[🔴 Menstruation] [🟡 Follikulär] [🩷 Ovulation] [🟦 Luteal]
```

Active chip: filled background matching phase color + white text.
Inactive chip: light grey background + dark text.
Min-score slider remains below the chips.

The "Automatisch: …" option from the old dropdown is replaced by pre-selecting the chip that
matches `currentPhase` on mount (already handled by existing `useState(currentPhase)`).

---

### AC-005-04: Wake lock — icon

**File:** `src/components/Navigation.tsx`

The text label `"Bildschirm: AN"` / `"Bildschirm: AUS"` is replaced with an inline SVG sun icon.
The existing `title` prop on the button already provides a browser tooltip — no change needed there.

Active state (isActive): icon rendered in `text-yellow-300` (bright).
Inactive state: icon rendered in `text-white opacity-50`.

SVG: simple sun icon (circle + 8 rays), ~16×16px, `currentColor`.

## Key Decisions

- **No new components** — changes are inline edits to existing files. A dedicated `<CollapsibleSection>`
  component would be over-engineering for one use case (YAGNI).
- **Single colour palette for CTAs** — blue matches the existing brand colour. Removing the
  rainbow avoids visual noise without introducing a new design token system.
- **Chips over pills/tabs** — chips (`<button>` with rounded corners) match the existing
  `bg-blue-100 text-blue-800` tag style already used in `IngredientFilter`.
- **Inline SVG over icon library** — avoids adding a dependency for a single icon.

## Out of Scope

- Mobile hamburger navigation (Phase 2)
- Recipe photos on cards (Phase 2)
- Skeleton loading states (Phase 2)
- Delete confirmation modal (Phase 2)
- Ingredient filter search (Phase 2)

## Open Questions

- None — all four changes are self-contained and have no external dependencies.
