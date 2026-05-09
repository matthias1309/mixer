# TEST-105: E2E Tests - Complete User Flow

**Type**: Test  
**Effort**: 8 story points  
**Priority**: P0 (Must Have)  
**Status**: Ready  
**Phase**: 5 - E2E & Documentation  
**Order**: 28th  

---

## Description

Write end-to-end tests for complete user journeys using Cypress. Tests cover the entire MVP workflow.

## Acceptance Criteria

- [ ] E2E test: Registration → Login → Dashboard
- [ ] E2E test: Create recipe → View detail → List updated
- [ ] E2E test: Edit recipe → Changes reflected
- [ ] E2E test: Delete recipe with confirmation
- [ ] E2E test: Filter by ingredients → Results updated
- [ ] E2E test: Session persistence (refresh page → still logged in)
- [ ] E2E test: Logout → Cannot access protected pages
- [ ] All critical paths tested
- [ ] Tests run successfully with `npm run test:e2e:ci`

## Dependencies

- TEST-101: Test Infrastructure
- All core features implemented (USR, REC, FLT)

## Implementation Notes

- Cypress tests in `tests/e2e/`
- Each test file: `.cy.ts`
- Use page object pattern for maintainability
- Clear, readable test descriptions
- Realistic user actions

## Testing

- Run with: `npm run test:e2e`
- CI run with: `npm run test:e2e:ci`
- All tests should pass

## Definition of Done

- [ ] All E2E tests created
- [ ] All tests passing
- [ ] Clear and maintainable test code
- [ ] Code review approved

## Related Documents

- Arc42: Section 8.4 (Testing Strategy - E2E Tests)
