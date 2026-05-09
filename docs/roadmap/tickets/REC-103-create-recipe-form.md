# REC-103: Create Recipe Form Component

**Type**: Feature  
**Effort**: 5 story points  
**Priority**: P0 (Must Have)  
**Status**: Ready  
**Phase**: 3 - Recipe Management  
**Order**: 13th  

---

## Description

Build React form component for creating recipes. Handles ingredient list management and form validation.

## Acceptance Criteria

- [ ] Add recipe page created at `/recipes/new`
- [ ] Form with all required fields (name, description, ingredients, instructions, servings)
- [ ] Dynamic ingredient list (add/remove ingredients)
- [ ] Client-side validation
- [ ] Clear error messages
- [ ] Submit button disabled during submission
- [ ] Loading state visible during submission
- [ ] Success redirect to recipe detail
- [ ] Error state with retry option
- [ ] Responsive design for mobile
- [ ] Accessible form (labels, ARIA)
- [ ] E2E test for form flow

## Dependencies

- REC-102: Create Recipe API
- INFRA-102: Project Structure
- TEST-101: Test Infrastructure

## Implementation Notes

- Form state management (useState or form library)
- Ingredient subcomponent for dynamic list
- Call POST /api/recipes on submit
- Display validation errors clearly
- Handle loading/error states
- Success: navigate to recipe detail page

## Testing

- Component tests with React Testing Library
- User interaction tests
- Validation tests
- E2E test: fill form → submit → detail page

## Definition of Done

- [ ] Form component created
- [ ] All fields working
- [ ] Validation working
- [ ] Error handling working
- [ ] Tests passing
- [ ] Code review approved
- [ ] Mobile responsive

## Related Documents

- Req42: 02-recipe-management.md (FR-201: Create Recipe)
