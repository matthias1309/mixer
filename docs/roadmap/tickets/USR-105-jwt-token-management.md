# USR-105: JWT Token Management

**Type**: Feature  
**Effort**: 3 story points  
**Priority**: P0 (Blocker)  
**Status**: Ready  
**Phase**: 2 - Authentication  
**Order**: 4th  

---

## Description

Implement JWT (JSON Web Token) generation, validation, and management. Required for stateless authentication across the application.

## Acceptance Criteria

- [ ] jsonwebtoken library installed
- [ ] JWT utility module created in `src/lib/auth/jwt.ts`
- [ ] Generate function: creates signed JWT with user info and expiration
- [ ] Verify function: validates JWT signature and expiration
- [ ] Decode function: extracts payload from token (without verification)
- [ ] Token includes: userId, email, iat, exp
- [ ] Token expiration set to 24 hours (configurable)
- [ ] Secret key from environment variable (JWT_SECRET)
- [ ] Secret key validation (minimum 32 characters required)
- [ ] Token stored in httpOnly, secure cookies
- [ ] Token cleared on logout
- [ ] Unit tests for token generation and verification

## Dependencies

- INFRA-102: Project Structure
- TEST-101: Test Infrastructure
- USR-104: Password Security (establishes auth pattern)

## Implementation Notes

- Use `jsonwebtoken` library
- JWT payload: `{ userId: string, email: string }`
- Expiration: 24 hours (via JWT_EXPIRATION env var)
- Secret minimum 32 characters enforced
- Create functions in `src/lib/auth/jwt.ts`:
  - `generateToken(userId: string, email: string): string`
  - `verifyToken(token: string): JWTPayload | null`
  - `decodeToken(token: string): JWTPayload | null`
- Cookie handling in middleware (separate ticket)

## Testing

- Unit tests in `src/__tests__/unit/auth/jwt.test.ts`
- Test cases:
  - Generate valid token → token format correct
  - Verify valid token → returns payload
  - Verify expired token → returns null or throws
  - Verify invalid token → returns null or throws
  - Decode token → payload extracted
  - Token includes correct claims (userId, email, exp)
  - Different tokens for different users

## Definition of Done

- [ ] JWT utility functions implemented
- [ ] All tests passing (100% coverage for jwt module)
- [ ] Expiration configurable via env var
- [ ] Secret key validation implemented
- [ ] Error handling for invalid tokens
- [ ] Code review approved
- [ ] Type definitions (JWTPayload) created

## Related Documents

- Arc42: Section 8.1 (Security - Authentication)
- Req42: 01-user-management.md (FR-102: User Login)
- RFC 7519 (JWT specification)
