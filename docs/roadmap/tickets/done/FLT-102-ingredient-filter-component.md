# FLT-102: Ingredient Filter Component

**Type**: Feature  
**Effort**: 5 story points  
**Priority**: P0 (Must Have)  
**Status**: Ready  
**Phase**: 4 - Filtering  
**Order**: 21st  

---

## Description

Build React component for ingredient selection. Users can select/deselect ingredients they have on hand.

## Acceptance Criteria

- [ ] IngredientFilter component created in `src/components/recipe/`
- [ ] Displays list of ingredients
- [ ] Each ingredient has checkbox or toggle
- [ ] Selected ingredients visually distinct
- [ ] Ingredients sorted alphabetically
- [ ] "Clear All" button to deselect all
- [ ] Show count of selected ingredients
- [ ] Responsive design for mobile
- [ ] Accessible (labels, ARIA)
- [ ] Component tests

## Dependencies

- FLT-101: Ingredient Extraction
- REC-104: Recipe List (where component is used)
- INFRA-102: Project Structure

## Implementation Notes

- Component receives ingredients array
- State management for selected ingredients
- Callback when selection changes
- Pass selected to recipe filter logic

## Testing

- Component tests with React Testing Library
- Test selection/deselection
- Test clear all functionality
- Test rendering of ingredients

## Definition of Done

- [ ] Component created and styled
- [ ] Selection working
- [ ] Tests passing
- [ ] Code review approved
- [ ] Mobile responsive

## Related Documents

- Req42: 03-recipe-filtering.md (FR-303: Filter UI Component)
