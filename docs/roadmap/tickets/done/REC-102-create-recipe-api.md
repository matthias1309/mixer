# REC-102: Create Recipe API Endpoint

**Type**: Feature  
**Effort**: 5 story points  
**Priority**: P0 (Must Have)  
**Status**: Ready  
**Phase**: 3 - Recipe Management  
**Order**: 12th  

---

## Description

Implement API endpoint to create new recipes. Users can submit recipe details with ingredients and instructions.

## Acceptance Criteria

- [ ] POST /api/recipes endpoint created
- [ ] Endpoint requires authentication
- [ ] Validates recipe name (required, 1-100 chars)
- [ ] Validates description (optional, max 500 chars)
- [ ] Validates ingredients (min 1, max 50)
- [ ] Validates each ingredient (name, quantity, unit)
- [ ] Validates instructions (required, 1-2000 chars)
- [ ] Validates servings (optional, positive integer)
- [ ] Recipe associated with authenticated user
- [ ] Recipe stored in database
- [ ] Returns created recipe with id on 201
- [ ] Clear error messages for validation failures
- [ ] Returns 400 for validation errors
- [ ] Returns 500 for database errors
- [ ] Integration tests for all scenarios

## Dependencies

- REC-101: Database Schema
- USR-106: Auth Middleware
- TEST-101: Test Infrastructure

## Implementation Notes

- POST endpoint at `/api/recipes`
- Require authentication (use middleware)
- Validate on server side
- Use schema from Req42
- Return full recipe object with id
- Ingredients stored with recipe

## Testing

- Integration tests: POST /api/recipes
  - Valid input → 201, recipe created
  - Missing name → 400
  - Invalid ingredients → 400
  - No auth → 401
  - Database error → 500

## Definition of Done

- [ ] API endpoint implemented
- [ ] Validation working
- [ ] Database insertion working
- [ ] All tests passing
- [ ] Code review approved
- [ ] Error messages clear

## Related Documents

- Arc42: Section 6.1 (Building Blocks - API)
- Req42: 02-recipe-management.md (FR-201: Create Recipe)
