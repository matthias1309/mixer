# USR-106: Auth Middleware & Protected Routes

**Type**: Feature  
**Effort**: 2 story points  
**Priority**: P0 (Blocker)  
**Status**: Completed  
**Phase**: 2 - Authentication  
**Order**: 5th  
**Completed**: 2026-05-09  

---

## Description

Create middleware to verify JWT tokens and protect routes. This enforces authentication on protected API endpoints and pages.

## Acceptance Criteria

- [ ] Auth middleware created in `src/lib/auth/middleware.ts`
- [ ] Middleware verifies JWT token from cookies
- [ ] Middleware extracts userId and email from token
- [ ] Middleware attaches user info to request context
- [ ] Middleware returns 401 for missing/invalid tokens
- [ ] Middleware returns 403 for expired tokens
- [ ] Protected API routes require valid token
- [ ] Protected pages require authentication
- [ ] Unauthenticated users redirected to login
- [ ] Unit tests for middleware validation
- [ ] Integration tests for protected endpoints

## Dependencies

- USR-104: Password Security
- USR-105: JWT Token Management
- TEST-101: Test Infrastructure

## Implementation Notes

- Create middleware in `src/lib/auth/middleware.ts`
- Export function: `authMiddleware(req: NextRequest): NextResponse`
- Extract token from cookies: `req.cookies.get('token')`
- Attach user to request: `req.user = { userId, email }`
- Use Next.js middleware pattern
- Error responses: 401 Unauthorized, 403 Forbidden
- Middleware should verify token validity

## Testing

- Unit tests in `src/__tests__/unit/auth/middleware.test.ts`
- Test cases:
  - Valid token → user attached to request
  - Missing token → 401 response
  - Invalid token → 401 response
  - Expired token → 403 response
  - Malformed token → 401 response

## Definition of Done

- [ ] Middleware implemented and tested
- [ ] All tests passing (100% coverage)
- [ ] Error handling for all token scenarios
- [ ] Integration with Next.js working
- [ ] Code review approved
- [ ] Usage documented in comments

## Related Documents

- Arc42: Section 8.1 (Security - Authorization)
- Req42: 01-user-management.md (FR-105: Protected Routes)
