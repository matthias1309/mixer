# REC-107: Delete Recipe

**Type**: Feature  
**Effort**: 3 story points  
**Priority**: P0 (Must Have)  
**Status**: Ready  
**Phase**: 3 - Recipe Management  
**Order**: 17th  

---

## Description

Implement recipe deletion with confirmation dialog. Users can safely remove recipes from their collection.

## Acceptance Criteria

- [ ] Delete button on recipe detail page
- [ ] Confirmation dialog appears on delete click
- [ ] Dialog shows recipe name and confirmation message
- [ ] DELETE /api/recipes/[id] endpoint created
- [ ] Endpoint requires authentication
- [ ] Only recipe owner can delete
- [ ] Returns 403 if user doesn't own recipe
- [ ] Recipe deleted from database
- [ ] Associated ingredients deleted
- [ ] User redirected to recipe list
- [ ] Success message shown
- [ ] Returns 204 No Content on success
- [ ] Returns 404 if recipe not found
- [ ] Integration tests for delete
- [ ] E2E test for delete flow

## Dependencies

- REC-105: Recipe Detail
- REC-102: Create Recipe API
- USR-106: Auth Middleware

## Implementation Notes

- DELETE endpoint at `/api/recipes/[id]`
- Check authorization: only owner
- Delete recipe and ingredients (cascade delete in DB)
- Return 204 No Content
- Confirmation dialog (custom or library)
- Redirect to /recipes after delete

## Testing

- Integration tests: DELETE /api/recipes/[id]
  - Valid id, owner → 204
  - Not owner → 403
  - Invalid id → 404
  - No auth → 401
- E2E test: click delete → confirm → recipe gone

## Definition of Done

- [ ] Delete button added
- [ ] Confirmation dialog working
- [ ] API endpoint implemented
- [ ] Authorization working
- [ ] Database deletion working
- [ ] Tests passing
- [ ] Code review approved

## Related Documents

- Req42: 02-recipe-management.md (FR-205: Delete Recipe)
