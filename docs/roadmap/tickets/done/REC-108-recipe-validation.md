# REC-108: Recipe Validation & Error Handling

**Type**: Chore  
**Effort**: 3 story points  
**Priority**: P0 (Must Have)  
**Status**: Ready  
**Phase**: 3 - Recipe Management  
**Order**: 18th  

---

## Description

Implement comprehensive validation and error handling for all recipe operations. Ensures data quality and good user experience.

## Acceptance Criteria

- [ ] Validation utility created: `src/lib/validation/recipe.ts`
- [ ] Recipe name validation (required, 1-100 chars)
- [ ] Description validation (optional, max 500 chars)
- [ ] Ingredients validation (min 1, max 50)
- [ ] Ingredient name validation (required, 1-100 chars)
- [ ] Ingredient quantity validation (positive number)
- [ ] Unit validation (predefined list: g, ml, tbsp, tsp, cup, etc.)
- [ ] Instructions validation (required, 1-2000 chars)
- [ ] Servings validation (optional, positive integer)
- [ ] Clear, user-friendly error messages
- [ ] Validation on client and server
- [ ] Server-side validation enforced (no trust client)
- [ ] Error response format consistent
- [ ] Unit tests for all validations
- [ ] Integration tests for error scenarios

## Dependencies

- REC-102: Create Recipe API
- TEST-101: Test Infrastructure

## Implementation Notes

- Create validation functions in `src/lib/validation/recipe.ts`
- Export from constants for reuse
- Client-side validation for UX
- Server-side validation for security
- Error responses: 400 Bad Request with details
- Error detail format: `{ field: string, message: string }[]`

## Testing

- Unit tests for each validation function
- Test boundaries (min/max lengths)
- Test type validation
- Test optional vs required fields
- Integration tests for API with invalid inputs

## Definition of Done

- [ ] Validation functions implemented
- [ ] All tests passing (100% coverage)
- [ ] Error messages clear and helpful
- [ ] Used in all recipe endpoints
- [ ] Code review approved

## Related Documents

- Req42: 02-recipe-management.md (FR-206: Recipe Data Validation)
