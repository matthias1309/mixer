# Phase 1 Design: Low-Hanging Fruit Features

**Date:** 2026-05-16  
**Project:** Recipe Manager  
**Phase:** 1 of 3  
**Status:** Design Approved

---

## Overview

Phase 1 focuses on three independent, high-impact improvements with minimal complexity:
1. **Screen Wake Lock Toggle** — Prevent screen dimming during recipe viewing
2. **Translations** — Translate Iron and Zinc nutrients to German (Eisen, Zink)
3. **Salt Nutrient Field** — Add Salt (Salz) field alongside existing Sodium (Natrium)

These features are prioritized as "low-hanging fruit" because they:
- Solve immediate UX pain points (screen lock for cooking)
- Fix existing i18n gaps (missing translations)
- Extend data model minimally (one new field)
- Have no cross-feature dependencies

---

## Feature 1: Screen Wake Lock Toggle

### Purpose
When viewing a recipe while cooking, users must repeatedly unlock their device as the screen dims. A global toggle prevents automatic screen dimming, keeping the recipe visible without interruption.

### Design

**Placement:** Navigation/Header (top-level, always visible)  
**Control:** Toggle button with visual state indicator

**States:**
- **OFF (default):** Screen follows normal system behavior (may dim/lock)
- **ON:** Browser prevents screen dimming using `Screen Wake Lock` API

**Persistence:** User preference stored in `localStorage`  
**Key:** `wake_lock_enabled` (boolean)

**Browser Compatibility:**
- Modern browsers support `navigator.wakeLock.request('screen')`
- Fallback: Toggle disabled with user-friendly message if unsupported
- Works on mobile (iOS Safari has limited support—document this)

### Implementation Notes
- Acquire wake lock when toggled ON
- Release wake lock when toggled OFF
- Restore state on app load from `localStorage`
- Handle wake lock release on app close/tab switch
- Show subtle visual indicator when active (e.g., icon changes, color shift)

### Success Criteria
- ✅ Toggle visible in header on all pages
- ✅ Wake lock acquired when ON, released when OFF
- ✅ Setting persists across browser sessions
- ✅ Graceful fallback for unsupported browsers
- ✅ No performance impact when OFF

---

## Feature 2: Translations (Iron → Eisen, Zinc → Zink)

### Purpose
Complete German translations for all nutrient labels throughout the app.

### Design

**Scope:** Iron and Zinc nutrients everywhere they appear:
- Nutrient display in recipe details
- Nutrient input fields (recipe creation/editing)
- Nutrient filters or search features
- Database seeds and default labels

**Implementation:**
- Update existing i18n locale files (e.g., `i18n/de.json`, `i18n/en.json`)
- Add translations:
  - `nutrients.iron` → "Eisen"
  - `nutrients.zinc` → "Zink"
- No database migration needed — labels are translated at display time
- Existing recipes retain original nutrient values

**Key Locations to Update:**
- Component labels for nutrient inputs
- Nutrient display components
- Any nutrient-related helper text or tooltips
- Seed data descriptions (if applicable)

### Success Criteria
- ✅ Iron displays as "Eisen" in German locale
- ✅ Zinc displays as "Zink" in German locale
- ✅ All instances updated (forms, displays, filters)
- ✅ English translations still work
- ✅ No breaking changes to existing recipes

---

## Feature 3: Salt Nutrient Field

### Purpose
Allow users to input and track salt content separately from sodium, providing more granular nutritional data.

### Design

**Database Change:**
- New column: `salt` (NUMERIC/DECIMAL type, nullable)
- Units: milligrams (mg), consistent with other nutrient fields
- Default: NULL (for existing recipes)
- Migration: Non-destructive, no data loss

**Schema Update:**
```sql
ALTER TABLE recipe_nutrients ADD COLUMN salt NUMERIC DEFAULT NULL;
```

**Form Layout:**
- Position: Immediately before the Sodium (Natrium) field
- Label: "Salz (mg)" in German, "Salt (mg)" in English
- Input: Standard number field, same as other nutrients
- Optional: Both fields remain optional

**Existing Data:**
- No changes to existing recipes
- Salt field empty until user edits recipe
- Sodium values unaffected

### Success Criteria
- ✅ Database migration creates `salt` field
- ✅ Form displays Salt field before Sodium
- ✅ Salt values save and load correctly
- ✅ Existing recipes unaffected
- ✅ No validation errors for NULL salt values

---

## Implementation Order

1. **Screen Wake Lock** — Implement UI toggle first (no dependencies)
2. **Translations** — Update i18n files (no dependencies)
3. **Salt Field** — Database migration + form updates (no dependencies)

All three can be developed in parallel with no blocking dependencies.

---

## Testing Strategy

### Screen Wake Lock
- Unit: Toggle state changes correctly
- Integration: localStorage persistence works
- E2E: Toggle visible, functional on recipe page
- Browser: Test fallback on unsupported browser

### Translations
- Check all nutrient labels render correctly in German
- Verify English still works
- Scan codebase for hardcoded nutrient strings (should use i18n keys)

### Salt Field
- Database: Migration runs successfully
- Form: Salt field appears in correct position
- Data: Saving/loading salt values works
- Existing recipes: No regression or data loss

---

## Success Metrics

**Phase 1 is complete when:**
- ✅ Screen wake lock toggle prevents screen dimming during active use
- ✅ Iron and Zinc display as Eisen and Zink throughout app
- ✅ Salt field appears in recipe forms and saves correctly
- ✅ All tests pass
- ✅ No breaking changes to existing functionality

---

## Next Steps

After Phase 1 completion and approval:
- **Phase 2:** Ingredient autocomplete + auto-create feature
- **Phase 3:** Responsive design for mobile

See `2026-05-16-phase2-ingredient-features-design.md` (to be created) for Phase 2 details.

---

## Notes for Future Phases

**Phase 2 Dependency:** Ingredient autocomplete does not depend on Phase 1 features; can be planned independently once Phase 1 is approved.

**Responsive Design:** Phase 3 should be reassessed for priority after Phases 1 and 2 are complete.
