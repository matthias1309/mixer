# USR-107: User Profile Page

**Type**: Feature  
**Effort**: 3 story points  
**Priority**: P1 (Should Have)  
**Status**: Ready  
**Phase**: 2 - Authentication  
**Order**: 9th  

---

## Description

Implement user profile page. Users can view and manage their account information.

## Acceptance Criteria

- [ ] Profile page created at `/profile` (protected route)
- [ ] Page displays user email address
- [ ] Page displays account creation date
- [ ] GET /api/users/profile endpoint created
- [ ] Endpoint requires authentication
- [ ] Endpoint returns current user information
- [ ] Navigation link to profile page visible
- [ ] Back link to dashboard from profile
- [ ] Clean, readable layout
- [ ] Mobile responsive design
- [ ] Integration tests for profile endpoint
- [ ] E2E test for profile flow

## Dependencies

- USR-102: User Login (user must be logged in)
- USR-106: Auth Middleware

## Implementation Notes

- Extract userId from JWT in middleware
- Query user from database by userId
- Return: { id, email, createdAt, updatedAt }
- Show formatted dates (e.g., "May 9, 2026")
- Profile editing (name, password) in future

## Testing

- Integration tests: GET /api/users/profile
  - With valid token → return user data
  - Without token → 401 Unauthorized
- E2E test: Login → Navigate to profile → View data

## Definition of Done

- [ ] Profile page created and styled
- [ ] API endpoint implemented
- [ ] Data fetching working
- [ ] All tests passing
- [ ] Code review approved
- [ ] Mobile responsive

## Related Documents

- Req42: 01-user-management.md (FR-104: User Profile)
