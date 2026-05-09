# USR-103: User Logout

**Type**: Feature  
**Effort**: 2 story points  
**Priority**: P0 (Must Have)  
**Status**: Ready  
**Phase**: 2 - Authentication  
**Order**: 8th  

---

## Description

Implement user logout functionality. Users can end their session and clear authentication token.

## Acceptance Criteria

- [ ] Logout button visible in authenticated state
- [ ] Logout button in navigation header
- [ ] POST /api/auth/logout endpoint created
- [ ] Endpoint clears JWT cookie
- [ ] Endpoint returns success response
- [ ] Client-side logout flow working
- [ ] User redirected to login page after logout
- [ ] After logout, user cannot access protected pages
- [ ] Session cleared completely
- [ ] Integration tests for logout endpoint
- [ ] E2E test for logout flow

## Dependencies

- USR-102: User Login
- USR-106: Auth Middleware

## Implementation Notes

- Clear cookie: set token to empty, maxAge: 0
- Redirect client to /login after logout
- GET or POST endpoint (POST preferred)
- No authentication required to logout (user can be logged in)
- Simple endpoint - just clear cookie

## Testing

- Integration tests: POST /api/auth/logout
  - With valid token → cookie cleared, redirect to login
  - Without token → still clear cookie (safe)
- E2E test: Login → Logout → cannot access /recipes

## Definition of Done

- [ ] Logout button added to navigation
- [ ] API endpoint implemented
- [ ] Cookie clearing working
- [ ] Redirect working
- [ ] All tests passing
- [ ] Code review approved

## Related Documents

- Req42: 01-user-management.md (FR-103: User Logout)
