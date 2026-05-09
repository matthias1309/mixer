# REC-105: Recipe Detail Page

**Type**: Feature  
**Effort**: 3 story points  
**Priority**: P0 (Must Have)  
**Status**: Ready  
**Phase**: 3 - Recipe Management  
**Order**: 15th  

---

## Description

Implement recipe detail page showing full recipe information including ingredients and instructions.

## Acceptance Criteria

- [ ] Recipe detail page at `/recipes/[id]` (protected)
- [ ] GET /api/recipes/[id] endpoint returns recipe
- [ ] Displays recipe name
- [ ] Displays description
- [ ] Displays full ingredients list with quantities
- [ ] Displays detailed instructions
- [ ] Displays servings
- [ ] Displays creation and modified dates
- [ ] Edit button visible to recipe owner
- [ ] Delete button visible to recipe owner
- [ ] Back to list link
- [ ] 404 if recipe not found
- [ ] 403 if user doesn't own recipe (viewing others' recipes in future)
- [ ] Clean, readable layout
- [ ] E2E test for viewing recipe

## Dependencies

- REC-102: Create Recipe API
- USR-106: Auth Middleware

## Implementation Notes

- Detail page template: `/recipes/[id]/page.tsx`
- GET /api/recipes/[id] returns full recipe with ingredients
- Check authorization: only owner can edit/delete
- Format dates nicely (e.g., "May 9, 2026 at 2:30 PM")
- Edit/Delete buttons conditional on ownership

## Testing

- Component tests for RecipeDetail
- Integration tests: GET /api/recipes/[id]
  - Valid id → returns recipe
  - Invalid id → 404
  - Unauthorized user → 403 (future)
- E2E test: view recipe details

## Definition of Done

- [ ] Detail page created
- [ ] API endpoint implemented
- [ ] Data fetching working
- [ ] Edit/Delete buttons conditional
- [ ] Tests passing
- [ ] Code review approved

## Related Documents

- Req42: 02-recipe-management.md (FR-203: View Recipe Detail)
