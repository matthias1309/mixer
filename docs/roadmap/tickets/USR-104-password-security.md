# USR-104: Password Hashing & Security

**Type**: Feature  
**Effort**: 3 story points  
**Priority**: P0 (Blocker)  
**Status**: Ready  
**Phase**: 2 - Authentication  
**Order**: 3rd  

---

## Description

Implement secure password hashing using bcrypt. This is a critical security component required for user authentication.

## Acceptance Criteria

- [ ] bcryptjs library installed and configured
- [ ] Password hashing utility created in `src/lib/auth/password.ts`
- [ ] Hash function: accepts plain password → returns bcrypt hash
- [ ] Verify function: compares plain password with hash → returns boolean
- [ ] Bcrypt cost factor set to 10 (configurable in constants)
- [ ] No plain-text passwords stored or logged
- [ ] Passwords salted automatically by bcrypt
- [ ] Hash verification works correctly
- [ ] Unit tests for hashing and verification
- [ ] Performance acceptable (< 500ms for hash operation)

## Dependencies

- INFRA-102: Project Structure
- TEST-101: Test Infrastructure

## Implementation Notes

- Use `bcryptjs` (not `bcrypt` for better cross-platform support)
- Cost factor: 10 (balance between security and performance)
- Never log passwords, even hashes should not be logged
- Create utility functions in `src/lib/auth/password.ts`:
  - `hashPassword(password: string): Promise<string>`
  - `verifyPassword(password: string, hash: string): Promise<boolean>`

## Testing

- Unit tests in `src/__tests__/unit/auth/password.test.ts`
- Test cases:
  - Hash valid password → returns hash
  - Hash different passwords → different hashes
  - Verify correct password → true
  - Verify wrong password → false
  - Hash timing attack resistance (no early return)

## Definition of Done

- [ ] Password utility functions implemented
- [ ] All tests passing (100% coverage for password module)
- [ ] No console logs for passwords
- [ ] Performance verified (< 500ms)
- [ ] Code review approved
- [ ] Constants updated with cost factor

## Related Documents

- Arc42: Section 8.1 (Security - Password Security)
- Req42: 01-user-management.md (FR-101: User Registration)
