# Code Reviews

Documentation of all ticket code reviews during project development.

## Purpose

Every ticket goes through a code review before being merged into `main`. This directory stores reviews for:

- Historical understanding (why was this decision made?)
- Learning purposes (patterns that help with future reviews)
- Accountability & quality assurance

---

## Reviews

### Phase 1: Infrastructure

- [INFRA-102: Next.js Project Structure](INFRA-102-project-structure.md) - ✅ APPROVED
  - Project structure (app, components, lib, api, types, styles)
  - TypeScript configuration with path aliases
  - Status: Merged in main

- [TEST-101: Test Infrastructure Setup](TEST-101-test-infrastructure.md) - ✅ APPROVED
  - Jest + React Testing Library + Cypress
  - Test utilities and sample tests
  - Coverage reporting
  - Status: Ready to merge

### Phase 2: Authentication

- [USR-104: Password Hashing & Security](USR-104.md) - ✅ APPROVED
  - bcryptjs-based password hashing utility
  - Async API to prevent event loop blocking
  - 100% test coverage, cost factor 10 for strong security
  - Status: Merged in main

- [USR-105: JWT Token Management](USR-105.md) - ✅ APPROVED
  - JWT token generation and verification with 24h expiration
  - Secret validation (minimum 32 characters required)
  - Proper error handling (returns null instead of throwing)
  - 93.75% test coverage (12 tests)
  - Status: Merged in main

- [USR-106: Auth Middleware & Protected Routes](USR-106.md) - ✅ APPROVED
  - Middleware for extracting and validating JWT tokens from cookies
  - Error differentiation: 401 for missing/invalid, 403 for expired tokens
  - Token forwarding via custom headers (x-user-id, x-user-email)
  - 100% test coverage, follows Next.js 15 patterns
  - Status: Merged in main

### Phase 3: Recipe Management

- [REQ-009: Recipe Photo](REQ-009-recipe-photo.md) - ✅ APPROVED
  - Optional recipe photo: upload on create/edit, shown on dashboard cards
  - Dedicated owner-only `POST` / public `GET` `/api/recipes/[id]/image`;
    images on disk, file name in `recipes.image_path`
  - 3 confirmed review findings fixed (cleanup-failure 500, object-URL
    leak, path-traversal hardening); 8 new tests
  - Status: Open in PR #25

### Phase 4: Filtering

*(Future)*

---

## Review Template

All reviews follow this structure:

- ✅ **Overview**: What, scope, risk
- ✅ **SOLID Principles**: SRP, OCP, LSP, ISP, DIP
- ✅ **Clean Code**: DRY, KISS, YAGNI
- ✅ **Acceptance Criteria**: Are they met?
- ✅ **Code Quality**: Linting, type-check, tests
- ✅ **Key Decisions**: Why these approaches?
- ✅ **Approval Status**: Status and rationale
- ✅ **Feedback**: Constructive notes for developers

---

## Review Process

1. **Developer creates ticket branch**
2. **Implementation & local testing**
3. **Code review conducted**
4. **Approval or feedback**
5. **Merge into main**
6. **Document review** (this directory)

---

## Metrics (updated as we go)

- Total reviews: 6
- Approved: 6
- Requested changes: 0
- Average review time: ~1 hour per ticket

---

## See Also

- [CLAUDE.md](../CLAUDE.md) - Code review process & criteria
- [Kanban Board](../roadmap/kanban.md) - Status of all tickets
