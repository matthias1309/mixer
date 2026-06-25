# Recipe Manager - Kanban Board & Project Roadmap

**Last Updated**: 2026-06-25
**Current Phase**: Phase 2 (Enhancements) — MVP shipped, Uberspace production live
**Production**: https://matt-maxx.de/rezepte (Uberspace, SQLite, auto-deploy on merge to `main`)
**Completed**: 164+ pts quantified (MVP + quality + maintenance) plus Phase 2 feature work (REQ-004–009, REC-109) tracked in V-Model docs
**Open Tickets**: 1 (MAINT-004, 2 pts, P3)

---

## Quick Links

- **📋 Open Tickets**: See `tickets/` directory
- **✅ Completed Tickets**: See `tickets/done/` and `done/`
- **📊 Status Overview**: See "Kanban Board" section below
- **📖 Requirements**: `../requirements/` (Phase 2) and `../requirements/mvp/` (MVP)
- **🏛️ Architecture**: `../architecture/arc42.md` + `ARCH-XXX.md`
- **🚀 Deployment**: `../deployment/uberspace-setup.md`

---

## Project Phases

### Phase 1: MVP ✅ Complete
**Scope**: User authentication, recipe CRUD, ingredient-based filtering
**Success Criteria**:
- ✅ User registration and login working
- ✅ Recipe creation, read, update, delete
- ✅ Ingredient-based recipe filtering
- ✅ All code with 80%+ test coverage
- ✅ Deployed to production (Uberspace — see Phase 2 / MAINT-003)

### Phase 2: Enhancements 🚧 In Progress
**Scope**: UX/UI improvements, public read access, nutrition, unit conversion,
recipe scaling, photo upload/OCR, cycle-based recommendations, and the
migration to Uberspace hosting.
**Status**: Most planned items shipped (see "Phase 2 — Completed" below).

### Phase 3: Advanced (Future)
**Ideas**: Photo-based ingredient recognition, recipe recommendation engine,
meal planning, shopping lists.

---

## 📊 Kanban Board Status

### ✅ Completed — MVP (Phase 1–5, 124 pts / 32 tickets)

**Phase 1: Infrastructure (8 pts)**
- [x] [INFRA-102](tickets/done/INFRA-102-project-structure.md) - Next.js Project Structure (3 pts) - ✅ 2026-05-09
- [x] [TEST-101](tickets/done/TEST-101-test-infrastructure.md) - Test Infrastructure Setup (5 pts) - ✅ 2026-05-09

**Phase 2: Authentication (23 pts)**
- [x] [USR-104](tickets/done/USR-104-password-security.md) - Password Hashing & Security (3 pts) - ✅ 2026-05-09
- [x] [USR-105](tickets/done/USR-105-jwt-token-management.md) - JWT Token Management (3 pts) - ✅ 2026-05-09
- [x] [USR-106](tickets/done/USR-106-auth-middleware.md) - Auth Middleware (2 pts) - ✅ 2026-05-09
- [x] [USR-101](tickets/done/USR-101-user-registration.md) - User Registration (5 pts) - ✅ 2026-05-15
- [x] [USR-102](tickets/done/USR-102-user-login.md) - User Login (5 pts) - ✅ 2026-05-15
- [x] [USR-103](tickets/done/USR-103-user-logout.md) - User Logout (2 pts) - ✅ 2026-05-15
- [x] [USR-107](tickets/done/USR-107-user-profile.md) - User Profile Page (3 pts) - ✅ 2026-05-15

**Phase 3: Recipe Management (32 pts)**
- [x] [REC-101](tickets/done/REC-101-database-schema.md) - Database Schema (3 pts) - ✅ 2026-05-15
- [x] [REC-102](tickets/done/REC-102-create-recipe-api.md) - Create Recipe API (5 pts) - ✅ 2026-05-15
- [x] [REC-103](tickets/done/REC-103-create-recipe-form.md) - Create Recipe Form (5 pts) - ✅ 2026-05-15
- [x] [REC-104](tickets/done/REC-104-recipe-list.md) - Recipe List & Dashboard (5 pts) - ✅ 2026-05-15
- [x] [REC-105](tickets/done/REC-105-recipe-detail.md) - Recipe Detail Page (3 pts) - ✅ 2026-05-15
- [x] [REC-106](tickets/done/REC-106-edit-recipe.md) - Edit Recipe (5 pts) - ✅ 2026-05-15
- [x] [REC-107](tickets/done/REC-107-delete-recipe.md) - Delete Recipe (3 pts) - ✅ 2026-05-15
- [x] [REC-108](tickets/done/REC-108-recipe-validation.md) - Recipe Validation (3 pts) - ✅ 2026-05-15

**Phase 4: Filtering (23 pts)**
- [x] [FLT-101](tickets/done/FLT-101-ingredient-extraction.md) - Ingredient Extraction (3 pts) - ✅ 2026-05-15
- [x] [FLT-102](tickets/done/FLT-102-ingredient-filter-component.md) - Ingredient Filter Component (5 pts) - ✅ 2026-05-15
- [x] [FLT-103](tickets/done/FLT-103-filter-logic.md) - Filter Logic (5 pts) - ✅ 2026-05-15
- [x] [FLT-104](tickets/done/FLT-104-realtime-filtering.md) - Real-time Filtering (3 pts) - ✅ 2026-05-15
- [x] [FLT-105](tickets/done/FLT-105-filter-state-management.md) - Filter State Management (2 pts) - ✅ 2026-05-15
- [x] [FLT-106](tickets/done/FLT-106-empty-states.md) - Empty State Handling (2 pts) - ✅ 2026-05-15
- [x] [FLT-107](tickets/done/FLT-107-performance-optimization.md) - Performance Optimization (3 pts) - ✅ 2026-05-15

**Phase 5: Testing & Documentation (38 pts)**
- [x] [TEST-102](tickets/done/TEST-102-auth-tests.md) - Auth Tests (5 pts) - ✅ 2026-05-15
- [x] [TEST-103](tickets/done/TEST-103-recipe-tests.md) - Recipe Tests (8 pts) - ✅ 2026-05-15
- [x] [TEST-104](tickets/done/TEST-104-filter-tests.md) - Filter Tests (5 pts) - ✅ 2026-05-15
- [x] [TEST-105](tickets/done/TEST-105-e2e-tests.md) - E2E Tests (8 pts) - ✅ 2026-05-15
- [x] [DOCS-101](tickets/done/DOCS-101-api-documentation.md) - API Documentation (3 pts) - ✅ 2026-05-15
- [x] [DOCS-103](tickets/done/DOCS-103-code-review-checklist.md) - Code Review Checklist (2 pts) - ✅ 2026-05-15
- [x] [DOCS-102](tickets/done/DOCS-102-deployment-guide.md) - Deployment Guide (2 pts) - ✅ 2026-05-16
- [x] [INFRA-101](tickets/done/INFRA-101-docker-deployment.md) - Docker & Deployment (5 pts) - ✅ 2026-05-16

**Bonus Features (delivered alongside the MVP, not separately pointed)**
- [x] Ingredients Master CRUD System - ✅ 2026-05-15
- [x] Phase-Based Recipe Scoring System - ✅ 2026-05-15
- [x] Nutritional Values Display - ✅ 2026-05-15
- [x] Menstrual Cycle Tracking - ✅ 2026-05-15
- [x] OCR Recipe Upload - ✅ 2026-05-15
- [x] Advanced Phase Filter - ✅ 2026-05-15

### ✅ Completed — Phase 2 (Enhancements)

Feature work is tracked in the V-Model docs (`requirements/`, `architecture/`,
`test-specs/`). Story points were not estimated for these REQ-level items.

- [x] **REQ-004** - Public Read Access (ADR-007) - ✅ implemented & tested
- [x] **REQ-005** - UX/UI Improvements Phase 1 - ✅ implemented & tested
- [x] **REQ-006** - Mobile Navigation & Delete Modal - ✅ implemented & tested
- [x] **REQ-007** - Skeleton Loader & Filter Search - ✅ implemented & tested
- [x] **REQ-008** - Fix `/api/nutrition/ingredients` Endpoint - ✅ implemented & tested
- [x] **REQ-009** - Recipe Photo Upload & Dashboard Display - ✅ 2026-06 (PR #25)
- [x] **REC-109** - Unit Conversion & Recipe Scaling (ADR-006) - ✅ implemented & tested

### ✅ Completed — Maintenance & Quality

- [x] [MAINT-001](done/MAINT-001-fix-eslint-errors.md) - Fix ESLint Errors & Warnings (5 pts) - ✅ 2026-05-16
- [x] [MAINT-002](tickets/done/MAINT-002-https-setup-raspberry-pi.md) - HTTPS Setup with Caddy (3 pts) - ✅ 2026-05-19 *(Raspberry Pi era — superseded by MAINT-003)*
- [x] [MAINT-003](tickets/MAINT-003-uberspace-migration.md) - Migrate Deployment from Raspberry Pi to Uberspace (13 pts) - ✅ 2026-06-15
- [x] [BUG-001](tickets/done/BUG-001-recipe-card-test-german-translation.md) - RecipeCard Test German Translation Mismatch (1 pt) - ✅
- [x] [BUG-002](tickets/done/BUG-002-failing-ingredient-master-tests.md) - Failing Ingredient Master CRUD Tests (2 pts) - ✅
- [x] [BUG-003](tickets/done/BUG-003-any-type-in-recipe-list.md) - Unsafe `any` Type in RecipeList (1 pt) - ✅
- [x] [BUG-004](tickets/done/BUG-004-fetch-logic-duplication.md) - Code Duplication in Fetch Logic (DRY) (3 pts) - ✅
- [x] [BUG-005](tickets/done/BUG-005-magic-strings-in-api-routes.md) - Magic Strings in API Routes (2 pts) - ✅
- [x] [BUG-006](tickets/done/BUG-006-test-coverage-below-80-percent.md) - Test Coverage Below 80% Target (3 pts) - ✅
- [x] [BUG-007](tickets/done/BUG-007-pagination-logic-not-extracted.md) - Pagination Logic Not Extracted (2 pts) - ✅
- [x] [BUG-008](tickets/done/BUG-008-incomplete-documentation.md) - Incomplete Documentation (ADRs & Reviews) (3 pts) - ✅
- [x] [BUG-009](tickets/done/BUG-009-nutrition-ingredients-route-wrong-table.md) - `/api/nutrition/ingredients` queried wrong table (2 pts) - ✅ 2026-06-15

### 🧹 Open — Tech Debt Follow-ups

**NICE TO HAVE (P3):**
- [ ] [MAINT-004](tickets/MAINT-004-remove-unused-nutrition-ingredients-table.md) - Remove Unused `nutrition_ingredients` Table (Migration 002) (2 pts)

---

## 🔄 Current Status

| Status | Count | Points |
|--------|-------|--------|
| Open (Ready) | 1 | 2 |
| In Progress | 0 | 0 |
| Under Review | 0 | 0 |
| Completed (quantified) | — | 164+ |
| Completed (Phase 2 REQ-level, unpointed) | 7 | — |

> "Quantified" = MVP (124) + Quality bugs BUG-001…009 (19) + MAINT-001 (5) +
> MAINT-002 (3) + MAINT-003 (13) = 164+ pts. Phase 2 REQ-004…009 and REC-109
> shipped without story-point estimates.

---

## 📋 How to Work with This Board

### Starting a Ticket
1. Pick an open ticket from the "Open" section above.
2. Open the ticket file in `tickets/` and read its acceptance criteria.
3. Follow the V-Model: confirm REQ → ARCH → TEST-SPEC exist before coding.
4. Create a branch: `git checkout -b <type>/<ticket>-<description>`.
5. Move the ticket to "In Progress" in this file.

### Completing a Ticket
1. Ensure all acceptance criteria are met.
2. Run tests: `npm run test:coverage` (80%+).
3. Run linter: `npm run lint` and type-check: `npx tsc --noEmit`.
4. Commit with the ticket/REQ ID (Conventional Commits).
5. Open a PR against `main` (auto-deploys to Uberspace on merge).
6. After merge, move the ticket file to `tickets/done/` and update this board.

---

## 📊 Velocity & Metrics

### Test Coverage
- Target: 80%+ code coverage — run `npm run test:coverage`.

### Code Quality
- Linting: `npm run lint` (must pass).
- Type checking: `npx tsc --noEmit` (must pass).
- Code review: use the DOCS-103 checklist (`../code-review-checklist.md`).

### Deployment
- Production: Uberspace at `https://matt-maxx.de/rezepte` under `BASE_PATH=/rezepte`.
- CI/CD: pushing to `main` triggers `.github/workflows/deploy.yml`
  (lint → type-check → tests → deploy → smoke test).
- Guide: `../deployment/uberspace-setup.md`.

---

## 🎯 Epic Breakdown (MVP)

### Epic 1: User Management & Authentication
**Requirements**: `../requirements/mvp/01-user-management.md`
**Tickets**: USR-101…107 + TEST-102

### Epic 2: Recipe Management
**Requirements**: `../requirements/mvp/02-recipe-management.md`
**Tickets**: REC-101…108 + TEST-103

### Epic 3: Recipe Filtering
**Requirements**: `../requirements/mvp/03-recipe-filtering.md`
**Tickets**: FLT-101…107 + TEST-104

### Epic 4: Infrastructure & DevOps
**Tickets**: INFRA-101, INFRA-102, MAINT-003 (Uberspace)

### Epic 5: Testing & Documentation
**Tickets**: TEST-101…105, DOCS-101…103

---

## ✅ Release Checklist — MVP v1.0 (achieved)

- [x] All MVP tickets completed
- [x] All tests passing (80%+ coverage)
- [x] Arc42 documentation complete
- [x] Req42 documentation complete (all 3 MVP specs)
- [x] Code review process validated (DOCS-103 checklist)
- [x] Linting passes: `npm run lint`
- [x] Type checking passes: `npx tsc --noEmit`
- [x] E2E tests passing
- [x] Deployed to production (Uberspace — MAINT-003)

---

## 📝 Notes

- **V-Model is mandatory**: REQ → ARCH → TEST-SPEC → Tests → Implementation.
  See `.claude/rules/v-model.md`.
- **Run `/traceability`** for an up-to-date coverage matrix across artifacts.
- **Raspberry Pi is deprecated**: the Pi + Docker Compose + PostgreSQL setup was
  replaced by Uberspace + SQLite in MAINT-003 (2026-06). Pi docs in
  `../deployment/` are kept for history only.

---

## 📞 Contact & Questions

**Developer**: Matthias Bender

**For questions**:
- Ticket-specific: check the ticket file in `tickets/` or `tickets/done/`.
- Requirements: `../requirements/`.
- Architecture: `../architecture/arc42.md`.
