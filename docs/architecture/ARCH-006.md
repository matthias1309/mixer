# ARCH-006 — Mobile Navigation & Löschen-Modal

**Status:** draft
**Created:** 2026-06-11
**Traces:** REQ-006
**Verified by:** TEST-006

## Summary

Two self-contained UI changes with no API or data-model impact:
1. A responsive hamburger menu in `Navigation.tsx` for viewports below 768 px.
2. An inline confirmation modal in the recipe detail page that replaces the browser `confirm()` dialog.

## Design

### AC-006-01: Mobile hamburger navigation

**File:** `src/components/Navigation.tsx`

New local state:
```typescript
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
```

Layout strategy using Tailwind responsive prefixes:

```
┌─────────────────────────────────────────────┐
│ 🍳 Recipe Manager          ☀  [≡]           │  ← mobile  (<md)
└─────────────────────────────────────────────┘
        ↓ menu open
┌─────────────────────────────────────────────┐
│  Rezepte                                    │
│  Zutaten                                    │
│  Zyklus                                     │
│  user@example.com                           │
│  Abmelden                                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 🍳 Recipe Manager   Rezepte  Zutaten  Zyklus  ☀  Abmelden  │  ← desktop (≥md)
└─────────────────────────────────────────────────────────────┘
```

- Desktop links row: `hidden md:flex` (hidden on mobile, flex on ≥md)
- Hamburger button: `flex md:hidden` (visible on mobile only)
- Mobile drawer: absolutely positioned block below nav, `w-full bg-blue-600`,
  conditionally rendered via `{isMobileMenuOpen && ...}`
- Close-on-outside-click: a full-screen invisible backdrop div rendered behind the drawer
  when open (`fixed inset-0 z-10`), clicking it sets `isMobileMenuOpen = false`
- Wake-lock button stays in the top bar on all viewports (not inside the drawer)

---

### AC-006-02: Delete confirmation modal

**File:** `src/app/recipes/[id]/page.tsx`

New local state:
```typescript
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
```

`handleDelete` is split into two phases:
1. **Open phase** — the "Löschen" button sets `isDeleteModalOpen = true` (no `confirm()` call).
2. **Confirm phase** — a new `handleDeleteConfirm` function performs the actual DELETE request
   and redirects.

Modal structure (rendered via React portal-free fixed overlay):
```
┌──────────────────────────────────────────┐
│  Rezept löschen                          │
│                                          │
│  Möchten Sie „<recipe.name>" wirklich    │
│  löschen? Diese Aktion kann nicht        │
│  rückgängig gemacht werden.              │
│                                          │
│          [Abbrechen]  [Löschen]          │
└──────────────────────────────────────────┘
```

Overlay: `fixed inset-0 bg-black/50 flex items-center justify-center z-50`
Panel: `bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl`

Keyboard accessibility:
- `onKeyDown` on the overlay: `Escape` → close modal
- `autoFocus` on the "Abbrechen" button (safe default — prevents accidental deletion)
- Tab cycles between the two buttons only (no full focus-trap library needed for two focusable elements)

## Key Decisions

- **No shared `<Modal>` component** — YAGNI. There is currently only one delete modal and one
  potential future use (ingredients page). Premature abstraction would add indirection for no
  gain now. Refactoring to a shared component remains easy once a second consumer exists.
- **Backdrop div over `useEffect` click listener** — the backdrop approach is simpler, more
  accessible (it is a real clickable element), and does not require cleanup logic.
- **Tailwind `md:` breakpoint (768 px)** — matches Tailwind's default `md` breakpoint, consistent
  with the existing grid (`lg:grid-cols-4`) used on the dashboard.
- **No animation library** — plain conditional rendering. Smooth transitions are a Phase 3 concern.

## Out of Scope

- Ingredients page delete confirmation modal (separate story)
- Animated open/close transitions
- Shared/reusable modal component
- Swipe-to-close on mobile
- Recipe photos on cards (Phase 2b)
- Skeleton loaders (Phase 2b)

## Open Questions

- None — changes are fully self-contained.
