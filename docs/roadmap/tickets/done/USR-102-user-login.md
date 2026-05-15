# USR-102: User Login

**Type**: Feature  
**Effort**: 5 story points  
**Priority**: P0 (Must Have)  
**Status**: Ready  
**Phase**: 2 - Authentication  
**Order**: 7th  

---

## Description

Implement user login functionality. Registered users can authenticate with email and password to access their recipes.

## Acceptance Criteria

- [ ] Login page created at `/login`
- [ ] Form component with email and password fields
- [ ] Form validates required fields
- [ ] POST /api/auth/login endpoint created
- [ ] Endpoint validates credentials
- [ ] Endpoint compares password with stored hash
- [ ] Generic error message: "Invalid email or password"
- [ ] Endpoint returns JWT token on success
- [ ] Token stored in httpOnly, secure cookie
- [ ] User session persists across page refreshes
- [ ] User redirected to dashboard after login
- [ ] Invalid credentials show error message
- [ ] Account lockout (optional future)
- [ ] Unit tests for credential validation
- [ ] Integration tests for login flow
- [ ] E2E test for complete login flow

## Dependencies

- USR-104: Password Security
- USR-105: JWT Token Management
- USR-106: Auth Middleware
- TEST-101: Test Infrastructure
- REC-101: Database Schema

## Implementation Notes

- Use password.verifyPassword() for comparison
- Never reveal which field was wrong (email or password)
- Generate JWT on successful login
- Set httpOnly cookie
- Redirect to /recipes (dashboard)
- Session persistence via cookie
- Login state check: verify token in middleware

## Testing

- Unit tests: credential comparison
- Integration tests: POST /api/auth/login
  - Valid credentials → token returned
  - Invalid email → 401 Unauthorized
  - Invalid password → 401 Unauthorized
  - Non-existent user → 401 Unauthorized
  - No email provided → 400 Bad Request
  - No password provided → 400 Bad Request
- E2E test: complete login flow and session persistence

## Definition of Done

- [ ] Login page created and styled
- [ ] Form validation working
- [ ] API endpoint implemented
- [ ] Password verification working
- [ ] Cookie-based session working
- [ ] Session persists on refresh
- [ ] All tests passing (80%+ coverage)
- [ ] Code review approved
- [ ] Documentation updated

## Related Documents

- Arc42: Section 6.2 (Runtime View - User Login Flow)
- Req42: 01-user-management.md (FR-102: User Login)
