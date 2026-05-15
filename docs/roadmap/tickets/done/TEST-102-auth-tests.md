# TEST-102: Authentication Tests

**Type**: Test  
**Effort**: 5 story points  
**Priority**: P0 (Blocker)  
**Status**: Ready  
**Phase**: 2 - Authentication  
**Order**: 10th (parallel with USR auth tickets)  

---

## Description

Write comprehensive unit and integration tests for all authentication functionality including password hashing, JWT, and auth endpoints.

## Acceptance Criteria

- [ ] Unit tests for password hashing (password.test.ts)
- [ ] Unit tests for JWT operations (jwt.test.ts)
- [ ] Unit tests for middleware (middleware.test.ts)
- [ ] Integration tests for registration endpoint
- [ ] Integration tests for login endpoint
- [ ] Integration tests for logout endpoint
- [ ] Integration tests for profile endpoint
- [ ] All auth code has 80%+ coverage
- [ ] Edge cases tested
- [ ] Error scenarios tested
- [ ] All tests passing

## Dependencies

- TEST-101: Test Infrastructure
- USR-104 through USR-107: Auth features implemented

## Testing Coverage

**Password Tests**:
- Hash password → valid hash
- Different passwords → different hashes
- Verify correct password → true
- Verify wrong password → false

**JWT Tests**:
- Generate token → valid JWT
- Verify valid token → payload extracted
- Verify expired token → null/error
- Verify invalid token → null/error

**Middleware Tests**:
- Valid token → user attached
- Invalid token → 401
- Expired token → 403
- Missing token → 401

**Integration Tests**:
- POST /api/auth/register (all scenarios)
- POST /api/auth/login (all scenarios)
- POST /api/auth/logout
- GET /api/users/profile

## Definition of Done

- [ ] All test files created
- [ ] All tests passing
- [ ] Coverage report shows 80%+
- [ ] No skipped tests
- [ ] Code review approved

## Related Documents

- Arc42: Section 8.4 (Testing Strategy)
- CLAUDE.md: Testing Requirements
