# REC-106: Edit Recipe

**Type**: Feature  
**Effort**: 5 story points  
**Priority**: P0 (Must Have)  
**Status**: Ready  
**Phase**: 3 - Recipe Management  
**Order**: 16th  

---

## Description

Implement recipe editing functionality allowing users to modify existing recipes.

## Acceptance Criteria

- [ ] Edit page at `/recipes/[id]/edit` (protected)
- [ ] PUT /api/recipes/[id] endpoint created
- [ ] Form pre-fills with current recipe data
- [ ] User can modify any field
- [ ] User can add/remove ingredients
- [ ] Validation same as creation
- [ ] Only recipe owner can edit
- [ ] Returns 403 if user doesn't own recipe
- [ ] Last modified date updated
- [ ] User redirected to detail page on success
- [ ] Success message shown
- [ ] Error handling for not found (404)
- [ ] Authorization checks working
- [ ] Integration tests for edit flow
- [ ] E2E test for edit flow

## Dependencies

- REC-102: Create Recipe API
- REC-103: Create Recipe Form (reuse form component)
- REC-105: Recipe Detail
- USR-106: Auth Middleware

## Implementation Notes

- PUT endpoint at `/api/recipes/[id]`
- Check authorization: only owner can edit
- Reuse form component from REC-103 (pre-filled)
- Update last modified timestamp
- Return updated recipe on success

## Testing

- Integration tests: PUT /api/recipes/[id]
  - Valid input, owner → 200, recipe updated
  - Not owner → 403 Forbidden
  - Invalid id → 404
  - Invalid input → 400
- E2E test: edit recipe → see changes reflected

## Definition of Done

- [ ] Edit page created
- [ ] API endpoint implemented
- [ ] Form pre-fills working
- [ ] Authorization working
- [ ] Tests passing
- [ ] Code review approved

## Related Documents

- Req42: 02-recipe-management.md (FR-204: Edit Recipe)
