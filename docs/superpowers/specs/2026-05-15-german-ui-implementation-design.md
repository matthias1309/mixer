# German UI Implementation Design

**Date:** 2026-05-15  
**Feature:** Complete German User Interface for MVP Phase 1  
**Status:** Design Phase  

---

## Overview

Implement a complete German translation of all user-facing text in the Recipe Manager application. This is an MVP Phase 1 priority that must be completed before the first release.

**Scope:** All static UI text (labels, buttons, menus, headings, form placeholders, nutrition labels, ingredient descriptions, etc.)  
**Exclusion:** Error messages and system/validation messages remain in English.  
**Language Support:** German only—no multi-language support planned.  

---

## Design Decisions

### Approach: Hardcoded German Texts (KISS)

**Rationale:**
- No external i18n library needed for single-language requirement
- Aligns with KISS and YAGNI principles
- Minimal setup overhead
- Texts directly in components where they're used

**Trade-off:** If multi-language support becomes necessary in the future, refactoring will be required. However, for current MVP scope, this is the most pragmatic choice.

---

## Scope of Translation

### What Gets Translated to German

1. **Page Titles & Headings**
   - Navigation headings
   - Page titles
   - Section headers
   - Card titles

2. **Button Labels & CTAs**
   - "Save" → "Speichern"
   - "Delete" → "Löschen"
   - "Edit" → "Bearbeiten"
   - "Add" → "Hinzufügen"
   - "Cancel" → "Abbrechen"
   - All other action buttons

3. **Form Elements**
   - Input labels
   - Placeholder text
   - Form field descriptions
   - Required indicators

4. **Recipe & Ingredient UI**
   - "My Recipes" → "Meine Rezepte"
   - "Create Recipe" → "Rezept erstellen"
   - "Ingredients" → "Zutaten"
   - "Instructions" → "Anleitung"
   - "Preparation Time" → "Zubereitungszeit"
   - "Cook Time" → "Kochzeit"
   - "Base Size" → "Portionsgröße"
   - All ingredient-related labels

5. **Nutrition Display**
   - "Calories" → "Kalorien"
   - "Protein" → "Protein"
   - "Fat" → "Fett"
   - "Carbohydrates" → "Kohlenhydrate"
   - All nutrition metric labels

6. **Cycle Tracking & Phase-Based Scoring**
   - "Cycle Tracking" → "Zyklus-Verfolgung"
   - "Phase" → "Phase"
   - All phase-related labels
   - All cycle-tracking UI text

7. **Navigation & Menus**
   - Header navigation items
   - Sidebar menu items
   - Footer links
   - All menu text

8. **Empty States & Confirmations**
   - "No recipes found" → "Keine Rezepte vorhanden"
   - Confirmation dialogs
   - Empty state messages
   - Success/information messages

9. **Informational Text**
   - Help text
   - Descriptions
   - Instructions
   - Tooltips (if present)

### What Remains in English

- **Error Messages**: Validation errors, system errors, exception messages
- **System Messages**: Debug info, logging, technical messages

---

## Implementation Strategy

### File Organization

```
src/components/
  ├── Button.tsx                    # German button labels
  ├── RecipeForm.tsx                # "Rezept erstellen", form labels
  ├── RecipeList.tsx                # "Meine Rezepte", filter labels
  ├── RecipeDetail.tsx              # All recipe detail German text
  ├── NutritionDisplay.tsx           # Nutrition labels in German
  ├── IngredientList.tsx             # Ingredient-related text
  ├── CycleTracker.tsx               # Cycle tracking German text
  ├── Navigation.tsx                 # Navigation menu items
  └── ... (all other components)

src/app/
  ├── page.tsx                      # Home page German content
  ├── recipes/
  │   ├── page.tsx                  # Recipe list page
  │   ├── new/page.tsx              # Recipe creation page
  │   └── [id]/page.tsx             # Recipe detail page
  ├── auth/
  │   ├── login/page.tsx            # Login form labels
  │   ├── register/page.tsx         # Registration form labels
  │   └── ... (other auth pages)
  └── ... (all other pages)
```

### Implementation Approach

**No centralized translation file.** German strings are hardcoded directly in components as:
- Inline string literals in JSX
- Component prop defaults
- Variable assignments
- Object keys/labels

**Example:**
```typescript
// Before (English)
<button>{isEditing ? "Save" : "Edit"}</button>

// After (German)
<button>{isEditing ? "Speichern" : "Bearbeiten"}</button>
```

---

## Specific German Terminology

| English | German |
|---------|--------|
| Save | Speichern |
| Delete | Löschen |
| Edit | Bearbeiten |
| Add | Hinzufügen |
| Cancel | Abbrechen |
| Create Recipe | Rezept erstellen |
| My Recipes | Meine Rezepte |
| Ingredients | Zutaten |
| Instructions | Anleitung |
| Calories | Kalorien |
| Protein | Protein |
| Fat | Fett |
| Carbohydrates | Kohlenhydrate |
| Base Size | Portionsgröße |
| Preparation Time | Zubereitungszeit |
| Cook Time | Kochzeit |
| Cycle Tracking | Zyklus-Verfolgung |
| Phase | Phase |

This list is illustrative. **All visible UI text must be translated**, not just these examples.

---

## Testing & Verification

### Manual Testing Process

1. **Visual Walkthrough**: Navigate all pages and screens, verify every visible text is German
2. **Check All States**: Test different UI states (empty, loaded, error, loading)
3. **Component Check**: Verify every component label, button, and placeholder is German
4. **Nutrition Display**: Confirm all nutrition metric labels are German
5. **Cycle Tracking**: Confirm all cycle-related text is German
6. **Forms**: Verify all form labels, placeholders, and validation feedback is German (except error messages)
7. **Navigation**: Check headers, sidebars, footers, menus

### Acceptance Criteria

- ✅ All user-facing text is in German
- ✅ No English text visible in UI (except error messages)
- ✅ All page titles, headings, buttons, labels are German
- ✅ Nutrition display labels are German
- ✅ Cycle tracking text is German
- ✅ Form fields and placeholders are German
- ✅ Navigation items are German
- ✅ Empty states and messages are German
- ✅ Error messages remain in English
- ✅ All MVP Phase 1 pages tested

---

## Future Considerations

**If multi-language support becomes needed later:**
- Extract strings to a centralized `translations.de.json` or similar structure
- Implement i18n middleware (next-intl or i18next)
- Add language switching mechanism

**Current approach does NOT block this future migration**, but refactoring will be required.

---

## Success Criteria

✅ MVP Phase 1 can be released with complete German UI  
✅ All static text is German  
✅ Error messages remain English  
✅ No English text visible in normal user flows  
✅ Application is usable and professional in German  

---

## Notes

- Code comments and documentation remain in English per CLAUDE.md standards
- Commit messages remain in English per project conventions
- Configuration and internal text strings remain in English
- Only user-facing UI text is translated
