# FLT-101: Ingredient Extraction Endpoint

**Type**: Feature  
**Effort**: 3 story points  
**Priority**: P0 (Must Have)  
**Status**: Ready  
**Phase**: 4 - Filtering  
**Order**: 20th  

---

## Description

Create API endpoint to extract unique ingredients from user's recipes and return them for filtering UI.

## Acceptance Criteria

- [ ] GET /api/recipes/ingredients endpoint created
- [ ] Endpoint requires authentication
- [ ] Returns list of unique ingredients from user's recipes
- [ ] Returns: `{ id: string, name: string }[]`
- [ ] Sorted alphabetically
- [ ] Duplicates removed (case-insensitive)
- [ ] Returns empty array if no recipes
- [ ] Response time <300ms
- [ ] Integration tests for endpoint

## Dependencies

- REC-102: Create Recipe API (recipes must exist)
- USR-106: Auth Middleware

## Implementation Notes

- Query all recipes for user
- Extract unique ingredient names
- Sort alphabetically
- Normalize names (trim, lowercase for comparison)
- Return unique list with display names

## Testing

- Integration tests: GET /api/recipes/ingredients
  - With recipes → returns ingredients
  - Empty recipes → returns empty array
  - Without auth → 401

## Definition of Done

- [ ] API endpoint implemented
- [ ] Tests passing
- [ ] Code review approved

## Related Documents

- Req42: 03-recipe-filtering.md (FR-301: Ingredient Inventory)
