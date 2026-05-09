# Recipe Filtering by Ingredients - Requirements

**Version**: 1.0  
**Date**: 2026-05-09  
**Status**: Active  
**Epic**: MVP - Phase 1  
**Priority**: Must Have  
**Owner**: Matthias Bender  

---

## 1. Overview

**Description**: Enable users to filter their recipes based on ingredients they have on hand. This is the key feature that enables users to discover what they can cook.

**Business Value**: 
- Core feature that differentiates the app from simple recipe storage
- Helps users make cooking decisions and reduce food waste
- Improves user engagement and app usefulness

**Success Criteria**:
- Users can select ingredients they have
- Recipe list updates to show only recipes they can cook
- Filter is intuitive and fast
- Users can clear filters and reset
- Filter state persists during session

---

## 2. Functional Requirements

### FR-301: Ingredient Inventory Management

- **Description**: Users should be able to track which ingredients they have available
- **Acceptance Criteria**:
  - User sees a list of all unique ingredients from their recipes
  - User can toggle ingredients as "available" or "not available"
  - Selected ingredients are visually distinguished (checked, highlighted)
  - Ingredient list is easy to scan (sorted alphabetically)
  - User can see which ingredients are currently selected
  - Selection state is remembered during the current session

### FR-302: Recipe Filtering by Ingredients

- **Description**: Recipes should be filtered based on selected ingredients
- **Acceptance Criteria**:
  - When user selects ingredients, recipe list updates in real-time
  - Recipes are shown ONLY if they contain ALL selected ingredients
  - If no recipes match, user sees helpful message: "No recipes found with these ingredients"
  - Filter works correctly with:
    - 1 ingredient selected
    - Multiple ingredients selected
    - All ingredients selected
  - Recipe count updates to show number of matching recipes
  - Performance: filtering < 500ms even with many recipes

### FR-303: Filter UI Component

- **Description**: Provide intuitive interface for ingredient selection
- **Acceptance Criteria**:
  - Clear section titled "Ingredients I Have" or similar
  - Shows all unique ingredients from user's recipes
  - Each ingredient is a clickable item (checkbox or toggle button)
  - Selected items are clearly marked
  - Search box to filter ingredient list (optional, "nice to have")
  - "Clear All" button to deselect all ingredients
  - "Select All" button to select all ingredients (future enhancement)
  - Layout works on mobile (responsive)
  - No horizontal scrolling needed

### FR-304: Filter Results Display

- **Description**: Recipe list should show results clearly based on filter
- **Acceptance Criteria**:
  - Recipe list header shows: "X recipes found with your ingredients"
  - Original recipe list temporarily replaced with filtered results
  - If multiple recipes match, they remain sortable (by date, name)
  - Each recipe card shows all ingredients (visual indication of match)
  - User can click filtered recipe to see details
  - User can toggle individual recipe ingredients to see matches

### FR-305: Filter State Management

- **Description**: Filter selections should be preserved during session
- **Acceptance Criteria**:
  - Selected ingredients remain checked when navigating to recipe detail and back
  - Filter state is cleared when user logs out
  - Filter state does NOT persist across sessions (future: save preferences)
  - When viewing a specific recipe, filter can still be active
  - Clicking back from recipe detail preserves filter state

### FR-306: Empty States

- **Description**: Handle empty or no-match scenarios gracefully
- **Acceptance Criteria**:
  - If user has no recipes: show helpful message with link to add recipe
  - If no recipes match selected ingredients: show message with option to clear filter
  - If no ingredients available yet (no recipes): show message explaining feature
  - All empty state messages are friendly and actionable

---

## 3. Non-Functional Requirements

### NFR-401: Performance - Filter Response Time

- **Requirement**: Ingredient filter should respond instantly
- **Measurement**: Time to update recipe list after ingredient selection
- **Target**: <500ms for typical recipe collections (< 100 recipes)

### NFR-402: Performance - Ingredient List Load

- **Requirement**: Ingredient selection UI should load quickly
- **Measurement**: Time to render ingredient list
- **Target**: <300ms

### NFR-403: Usability - Filter Discovery

- **Requirement**: Users should easily find the filter feature
- **Measurement**: User testing, A/B testing
- **Target**: 80% of users find filter within first use

### NFR-404: Data Accuracy

- **Requirement**: Filter results should be 100% accurate
- **Measurement**: Unit tests, integration tests
- **Target**: Zero false positives/negatives

### NFR-405: Mobile Experience

- **Requirement**: Filter should work smoothly on mobile devices
- **Measurement**: Test on various screen sizes
- **Target**: No layout issues, responsive design, touch-friendly

---

## 4. User Stories

### US-301: Filter Recipes by Available Ingredients

**As a** home cook  
**I want to** select ingredients I have and see recipes I can make  
**So that** I can efficiently use ingredients on hand and reduce food waste  

**Acceptance Criteria**:
- [ ] I see a list of ingredients from my recipes
- [ ] I can click to select/deselect ingredients
- [ ] Recipe list updates to show only recipes with ALL selected ingredients
- [ ] I see how many recipes match my selected ingredients
- [ ] If no recipes match, I see a helpful message
- [ ] My selections remain when I navigate to recipe details and back
- [ ] I can clear all selections with one click
- [ ] The filter works fast (< 500ms)

**Tasks**:
- [ ] Create IngredientFilter component with ingredient list
- [ ] Create ingredient selection state management
- [ ] Create filter logic to match recipes with selected ingredients
- [ ] Create RecipeList component with dynamic filtering
- [ ] Create empty state component for no matches
- [ ] Implement real-time filtering (< 500ms response)
- [ ] Create GET /api/recipes/ingredients endpoint (unique ingredient list)
- [ ] Write unit tests for filter logic
- [ ] Write integration tests for filtering API
- [ ] Write E2E test for complete filtering flow
- [ ] Optimize query performance with indexes
- [ ] Test with large recipe collections (100+ recipes)

**Estimated Effort**: 8 story points

---

### US-302: View Which Ingredients I Need

**As a** recipe viewer  
**I want to** know which ingredients from a recipe I don't have  
**So that** I can make a shopping list  

**Acceptance Criteria**:
- [ ] On recipe detail page, ingredients are highlighted/marked
- [ ] Ingredients I selected appear differently than ones I didn't
- [ ] I can see at a glance what I'm missing
- [ ] This helps me decide if I want to cook this recipe

**Tasks**:
- [ ] Modify recipe detail component to show ingredient status
- [ ] Pass selected ingredients context to recipe detail
- [ ] Mark ingredients as "available" vs "missing"
- [ ] Visual distinction (color, icon, checkmark)
- [ ] Write E2E test showing ingredient status on detail page

**Estimated Effort**: 3 story points

---

### US-303: Search Within Ingredients

**As a** user with many ingredients  
**I want to** search/filter the ingredient list  
**So that** I can quickly find ingredients I'm looking for  

**Acceptance Criteria**:
- [ ] Search box above ingredient list
- [ ] As I type, ingredient list filters (live search)
- [ ] Search works on ingredient name
- [ ] Non-matching ingredients fade or hide
- [ ] I can clear search and see all ingredients again

**Tasks**:
- [ ] Add search input to IngredientFilter component
- [ ] Implement ingredient filtering by search term
- [ ] Write unit tests for search logic
- [ ] Write E2E test for ingredient search

**Estimated Effort**: 2 story points (nice-to-have, can be added later)

---

## 5. Dependencies

**External Dependencies**:
- None for MVP

**Internal Dependencies**:
- Requires: User Management (FR-101, FR-102)
- Requires: Recipe Management (FR-201 - FR-205)
- Required by: Future nutrient filtering feature

---

## 6. Assumptions

- All recipes have at least one ingredient
- Ingredient names are exact text matches (case-insensitive)
- Users don't need ingredient quantity precision for filtering (just presence/absence)
- Ingredient list will remain manageable (< 200 unique ingredients typical)
- No need for ingredient aliases or substitutions in MVP

---

## 7. Constraints

- Filter must work without page reload (real-time, AJAX)
- Filter results must include only recipes where ALL selected ingredients are present
- Cannot filter by ingredient quantity or portion size in MVP
- Cannot use ingredient weights/conversions in MVP
- Must work on Raspberry Pi without performance degradation

---

## 8. Out of Scope

- Ingredient quantity-based filtering (future)
- Ingredient substitution suggestions (future)
- Nutritional filtering (future - Phase 2)
- Ingredient conversion units (future)
- Shopping list generation (future)
- Inventory management (tracking quantities, expiration) (future)
- Ingredient price information (future)
- Seasonal ingredient suggestions (future)

---

## 9. Testing Strategy

**Unit Tests**:
- Ingredient extraction from recipes
- Filter logic (all selected ingredients present)
- Ingredient list sorting
- Empty state logic
- Search logic (if implemented)

**Integration Tests**:
- GET /api/recipes/ingredients: returns unique ingredient list
- GET /api/recipes?ingredients=x,y,z: returns filtered recipes
- Edge case: no recipes match
- Edge case: all recipes match
- Edge case: only 1 recipe
- Performance test: large recipe collection (100+ recipes)

**E2E Tests** (Cypress):
- Complete filter flow: open app → see ingredients → select 2 ingredients → see filtered recipes
- No match: select ingredients → no recipes found → clear filter → recipes reappear
- Detail and back: select ingredients → click recipe → view detail → back → filter still active
- Mobile: filter works on mobile screen size

**Test Coverage Target**: 80%+ for filtering code

---

## 10. Documentation

**User Documentation**:
- How to use the ingredient filter
- Understanding filter results (ALL ingredients required)
- Common use cases and examples
- Quick tutorial/first-time user guide

**Developer Documentation**:
- Filter algorithm and logic
- API endpoint for ingredient extraction
- Frontend state management for filter
- Performance optimization notes

**Code Comments**:
- Filter logic explanation (why ALL not ANY)
- Ingredient matching algorithm
- Performance-critical sections

---

## 11. Definition of Done

- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (filter logic, ingredient extraction)
- [ ] Integration tests written and passing (filter API endpoint)
- [ ] E2E tests for ingredient selection and filtering flows
- [ ] Code coverage ≥80% for filter-related code
- [ ] Performance verified (< 500ms filtering)
- [ ] Code reviewed and approved
- [ ] Documentation updated (Arc42 and Req42)
- [ ] Responsive design tested on mobile
- [ ] No breaking changes to existing functionality
- [ ] Filter results 100% accurate (verified by tests)

---

## 12. Notes and Open Questions

- Q: Should filter be AND (all selected) or OR (any selected)? A: AND - more useful for "what can I cook"
- Q: Should ingredient matching be case-sensitive? A: No, case-insensitive
- Q: Should ingredient whitespace be normalized? A: Yes (trim, single spaces)
- Q: Should we support partial ingredient matches? A: No, exact match for MVP
- Q: What if recipe has "olive oil" and user selects "oil"? A: Won't match (exact match)
- Future enhancement: Ingredient aliases (oil = olive oil, butter = margarine, etc.)
- Note: Shopping list generation is separate feature that could build on filter
- Note: Nutrient-based filtering (Phase 2) will be separate implementation
