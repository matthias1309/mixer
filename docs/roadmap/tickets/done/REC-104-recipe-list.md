# REC-104: Recipe List & Dashboard

**Type**: Feature  
**Effort**: 5 story points  
**Priority**: P0 (Must Have)  
**Status**: Ready  
**Phase**: 3 - Recipe Management  
**Order**: 14th  

---

## Description

Implement dashboard page displaying user's recipes with sorting, searching, and pagination capabilities.

## Acceptance Criteria

- [ ] Dashboard page at `/recipes` (protected)
- [ ] GET /api/recipes endpoint returns user's recipes
- [ ] Displays all recipes in list/card format
- [ ] Shows recipe name, description, ingredient count
- [ ] Sorting by: creation date (default), name
- [ ] Search by recipe name (client-side)
- [ ] Pagination or infinite scroll for many recipes
- [ ] Click recipe to view details
- [ ] "Add Recipe" button visible
- [ ] Empty state message if no recipes
- [ ] Loading state visible while fetching
- [ ] Responsive design for mobile
- [ ] E2E test for browsing recipes

## Dependencies

- REC-102: Create Recipe API
- USR-106: Auth Middleware
- TEST-101: Test Infrastructure

## Implementation Notes

- Dashboard is main authenticated view
- GET /api/recipes returns paginated list
- Server: sort and filter recipes
- Client: can sort and search further
- Recipe card component for list item
- Empty state: helpful message with link to add recipe

## Testing

- Component tests for RecipeList
- Integration tests: GET /api/recipes
  - With auth → returns user's recipes
  - Without auth → 401
  - Pagination working
- E2E test: Login → view recipes → click recipe

## Definition of Done

- [ ] Dashboard page created
- [ ] API endpoint implemented
- [ ] List rendering working
- [ ] Sorting/search working
- [ ] All tests passing
- [ ] Code review approved
- [ ] Mobile responsive

## Related Documents

- Req42: 02-recipe-management.md (FR-202: View Recipe List)
