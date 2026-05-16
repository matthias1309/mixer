# Phase 2 Design: Ingredient Features

**Date:** 2026-05-16  
**Project:** Recipe Manager  
**Phase:** 2 of 3  
**Status:** Design Approved

---

## Overview

Phase 2 adds two complementary features for ingredient management:
1. **Ingredient Autocomplete** — Suggest existing ingredients when typing in recipe creation
2. **Auto-Create Ingredients** — Allow users to add new ingredients on-the-fly with minimal friction

Together, these features streamline recipe creation by reducing manual ingredient entry while enabling users to extend the ingredient database without leaving the recipe form.

---

## Feature 1: Ingredient Autocomplete

### Purpose
When creating or editing a recipe and entering ingredients, users frequently type ingredients that already exist in the database. Autocomplete eliminates redundant entries and prevents spelling variations (e.g., "tomato" vs "tomate").

### Design

**Trigger:** Text input field for ingredient name in recipe creation/editing form

**Behavior:**
- **Input:** User types 2+ characters
- **Query:** Real-time search against ingredient database (name, case-insensitive)
- **Display:** Dropdown list of matching ingredients (max 5-10 suggestions)
- **Selection:** Clicking suggestion adds ingredient to recipe with quantity/unit fields

**Search Logic:**
- Case-insensitive substring matching (e.g., "tom" matches "Tomate", "tomatoe")
- Sort by relevance (exact matches first, then partial)
- Return only ingredients not already in the current recipe

**UI Pattern:**
- Autocomplete dropdown appears below input field
- Max height with scroll if needed (e.g., max 200px height)
- Click outside closes dropdown
- Pressing Escape closes dropdown
- Arrow keys navigate suggestions, Enter selects

**Empty State:**
- If no matches found, dropdown shows: "Keine Zutaten gefunden"
- Below that, option to "Neue Zutat erstellen" (see Feature 2)

### Success Criteria
- ✅ Autocomplete triggers after 2 characters
- ✅ Dropdown displays up to 10 matching ingredients
- ✅ Selection adds ingredient to recipe
- ✅ Already-added ingredients excluded from suggestions
- ✅ Keyboard navigation works (arrow keys, Enter, Escape)
- ✅ No duplicate entries in recipe

---

## Feature 2: Auto-Create Ingredients

### Purpose
Not all ingredients are in the database. Rather than breaking the recipe creation flow, users can quickly add a new ingredient and continue.

### Design

**Trigger:** User sees "Keine Zutaten gefunden" message in autocomplete dropdown and clicks "Neue Zutat erstellen" button

**Workflow:**
1. Modal/Dialog opens with title "Neue Zutat erstellen"
2. Single text input field: "Zutat-Name (Deutsch)" — required
3. Cancel and Create buttons
4. User enters name and clicks Create

**After Creation:**
- New ingredient is immediately **added to the current recipe**
- Modal closes
- User continues entering quantity/unit for the new ingredient
- Ingredient is **persisted to database** for future use

**Validation:**
- Name field required (non-empty)
- Name must be unique in database (case-insensitive check)
- If duplicate: Error message "Diese Zutat existiert bereits" and suggest existing ingredient

**Data Stored:**
- `id` (auto-generated UUID)
- `name_de` (German name, required)
- `name_en` (English name, optional — defaults to same as German for now)
- `created_at` (timestamp)

### Success Criteria
- ✅ Modal opens when "Neue Zutat erstellen" clicked
- ✅ Name field accepts text input
- ✅ Create button saves ingredient and adds to recipe
- ✅ Cancel button closes modal without adding
- ✅ Duplicate check prevents creating identical ingredients
- ✅ New ingredient appears in autocomplete for future recipes

---

## Integration with Recipe Form

### Ingredient Input Section
- User inputs ingredient name (triggers autocomplete)
- Selects from dropdown **or** creates new via "Neue Zutat erstellen"
- Quantity field (e.g., 500)
- Unit field (e.g., g, ml, cup)
- Nährstoffe inputs (if applicable)
- Add/Remove ingredient buttons

### Data Flow
```
User types ingredient name
  ↓
Autocomplete queries database (2+ chars)
  ↓
Results shown in dropdown
  ├─ User selects existing → Add to recipe
  └─ No match shown → "Neue Zutat erstellen" button
                        ↓
                      Modal opens (name only)
                        ↓
                      User creates ingredient
                        ↓
                      Ingredient added to recipe immediately
                        ↓
                      User enters quantity/unit/nutrients
```

---

## Database Impact

### New/Modified Tables

**`ingredients` table:**
- `id` (UUID, primary key)
- `name_de` (VARCHAR, required, unique)
- `name_en` (VARCHAR, optional)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

No breaking changes to existing schema. If `ingredients` table doesn't exist, migration creates it.

---

## Testing Strategy

### Autocomplete
- Unit: Search algorithm returns correct matches
- Integration: Database query works, no duplicates in recipe
- E2E: Type in ingredient field, see dropdown, select ingredient, verify added to recipe

### Auto-Create
- Unit: Validation (name required, uniqueness check)
- Integration: New ingredient saves to database, appears in autocomplete
- E2E: Create new ingredient via modal, verify immediately added to current recipe

### Edge Cases
- Duplicate ingredient detection (case-insensitive)
- Very long ingredient names
- Special characters in names
- Rapid submissions (debounce/loading state)
- Already-added ingredients excluded from autocomplete

---

## Success Metrics

**Phase 2 is complete when:**
- ✅ Autocomplete works for all existing ingredients
- ✅ New ingredients can be created without leaving recipe form
- ✅ Newly created ingredients appear in autocomplete for future recipes
- ✅ Duplicate detection prevents redundant entries
- ✅ All tests pass
- ✅ No breaking changes to existing recipes

---

## Next Steps

After Phase 2 completion:
- **Phase 3:** Responsive design for mobile/tablet

See `2026-05-16-phase3-responsive-design.md` for Phase 3 details.

---

## Notes

- Phase 2 depends on Phase 1 being complete
- Phase 2 is independent of Phase 3 (responsive design)
- Ingredient autocomplete can be extended in future phases (e.g., search by nutrient, categorization)
