# ADR-001: JWT Authentication with Refresh Tokens

**Status**: Accepted  
**Date**: 2026-05-19  
**Context**: Multi-user recipe management application needs secure authentication mechanism.

## Decision

Implement JWT (JSON Web Token) based authentication with refresh tokens for session management.

**Key Components**:
- Access tokens: Short-lived (24h), used for API requests
- Refresh tokens: Longer-lived, used to obtain new access tokens
- Token storage: Cookies with httpOnly flag for security
- Middleware-based authentication checks on protected routes

## Consequences

**Advantages**:
- Stateless authentication (no session storage needed)
- Secure token rotation mechanism
- Works well with distributed systems
- Prevents CSRF attacks (httpOnly cookies)
- Supports multi-tab/multi-device scenarios

**Disadvantages**:
- Token revocation requires additional mechanisms (token blacklist)
- JWT payload size overhead
- Token format doesn't change per user action

## Alternatives Considered

1. **Session-based authentication** (Express sessions)
   - Requires server-side session storage
   - Better for single-server deployments
   - More complex with distributed systems

2. **OAuth2** (Google, GitHub)
   - External dependency on third-party providers
   - Adds complexity for MVP phase
   - Good for future integration

## Implementation Details

- **Token generation**: `src/lib/auth/tokenRefresh.ts`
- **Middleware**: `src/lib/auth/middleware.ts`
- **Database**: User password stored with bcrypt hashing (cost factor 10)
- **Endpoints**: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`

## Related Files

- `src/lib/auth/tokenRefresh.ts`
- `src/lib/auth/middleware.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
