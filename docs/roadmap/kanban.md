# Recipe Manager - Kanban Board & Project Roadmap

**Last Updated**: 2026-05-16  
**Current Phase**: MVP - Phase 5 Complete (Testing & Documentation) + Quality Review  
**Velocity**: 91+ pts completed  
**Total Tickets**: 40 (32 MVP + 8 Quality Findings)  
**Total Effort**: ~127 story points  
**Completed**: 30 / 40 (91 / 127 pts) - 72% of total scope (84% of MVP only)  

---

## Quick Links

- **📋 All Tickets**: See `tickets/` directory
- **📊 Status Overview**: See "Kanban Board" section below
- **📅 Recommended Order**: See "Recommended Implementation Order" section below
- **📖 Requirements**: See `../requirements/mvp/` for detailed specs

---

## Project Phases

### Phase 1: MVP (Current)
**Scope**: User authentication, recipe CRUD, basic ingredient filtering  
**Target Completion**: TBD  
**Success Criteria**:
- ✅ User registration and login working
- ✅ Recipe creation, read, update, delete
- ✅ Ingredient-based recipe filtering
- ✅ All code with 80%+ test coverage
- ✅ Deployed to Raspberry Pi

### Phase 2: Enhancements (Future)
**Scope**: Nutrient-based filtering, recipe import, advanced features  
**Ideas**: Recipe API import, Nutritional filtering, Meal planning, Shopping lists

### Phase 3: Advanced (Future)
**Scope**: Scaling, AI features  
**Ideas**: Photo-based ingredient recognition, Recipe recommendation engine, Nutrition tracking

---

## 📊 Kanban Board Status

### ✅ Completed (Phase 1-4)
**Phase 1: Infrastructure (8 pts)**
- [x] [INFRA-102](tickets/INFRA-102-project-structure.md) - Next.js Project Structure (3 pts) - ✅ 2026-05-09
- [x] [TEST-101](tickets/TEST-101-test-infrastructure.md) - Test Infrastructure Setup (5 pts) - ✅ 2026-05-09

**Phase 2: Authentication (31 pts)**
- [x] [USR-104](tickets/USR-104-password-security.md) - Password Hashing & Security (3 pts) - ✅ 2026-05-09
- [x] [USR-105](tickets/USR-105-jwt-token-management.md) - JWT Token Management (3 pts) - ✅ 2026-05-09
- [x] [USR-106](tickets/USR-106-auth-middleware.md) - Auth Middleware (2 pts) - ✅ 2026-05-09
- [x] [USR-101](tickets/USR-101-user-registration.md) - User Registration (5 pts) - ✅ 2026-05-15
- [x] [USR-102](tickets/USR-102-user-login.md) - User Login (5 pts) - ✅ 2026-05-15
- [x] [USR-103](tickets/USR-103-user-logout.md) - User Logout (2 pts) - ✅ 2026-05-15
- [x] [USR-107](tickets/USR-107-user-profile.md) - User Profile Page (3 pts) - ✅ 2026-05-15

**Phase 3: Recipe Management (32 pts)**
- [x] [REC-101](tickets/REC-101-database-schema.md) - Database Schema (3 pts) - ✅ 2026-05-15
- [x] [REC-102](tickets/REC-102-create-recipe-api.md) - Create Recipe API (5 pts) - ✅ 2026-05-15
- [x] [REC-103](tickets/REC-103-create-recipe-form.md) - Create Recipe Form (5 pts) - ✅ 2026-05-15
- [x] [REC-104](tickets/REC-104-recipe-list.md) - Recipe List & Dashboard (5 pts) - ✅ 2026-05-15
- [x] [REC-105](tickets/REC-105-recipe-detail.md) - Recipe Detail Page (3 pts) - ✅ 2026-05-15
- [x] [REC-106](tickets/REC-106-edit-recipe.md) - Edit Recipe (5 pts) - ✅ 2026-05-15
- [x] [REC-107](tickets/REC-107-delete-recipe.md) - Delete Recipe (3 pts) - ✅ 2026-05-15
- [x] [REC-108](tickets/REC-108-recipe-validation.md) - Recipe Validation (3 pts) - ✅ 2026-05-15

**Phase 4: Filtering (28 pts)**
- [x] [FLT-101](tickets/FLT-101-ingredient-extraction.md) - Ingredient Extraction (3 pts) - ✅ 2026-05-15
- [x] [FLT-102](tickets/FLT-102-ingredient-filter-component.md) - Ingredient Filter Component (5 pts) - ✅ 2026-05-15
- [x] [FLT-103](tickets/FLT-103-filter-logic.md) - Filter Logic (5 pts) - ✅ 2026-05-15
- [x] [FLT-104](tickets/FLT-104-realtime-filtering.md) - Real-time Filtering (3 pts) - ✅ 2026-05-15
- [x] [FLT-105](tickets/FLT-105-filter-state-management.md) - Filter State Management (2 pts) - ✅ 2026-05-15
- [x] [FLT-106](tickets/FLT-106-empty-states.md) - Empty State Handling (2 pts) - ✅ 2026-05-15
- [x] [FLT-107](tickets/FLT-107-performance-optimization.md) - Performance Optimization (3 pts) - ✅ 2026-05-15

**Phase 5: Testing & Documentation (26 + 5 pts)**
- [x] [TEST-102](tickets/TEST-102-auth-tests.md) - Auth Tests (5 pts) - ✅ 2026-05-15
- [x] [TEST-103](tickets/TEST-103-recipe-tests.md) - Recipe Tests (8 pts) - ✅ 2026-05-15
- [x] [TEST-104](tickets/TEST-104-filter-tests.md) - Filter Tests (5 pts) - ✅ 2026-05-15
- [x] [TEST-105](tickets/TEST-105-e2e-tests.md) - E2E Tests (8 pts) - ✅ 2026-05-15
- [x] [DOCS-101](tickets/DOCS-101-api-documentation.md) - API Documentation (3 pts) - ✅ 2026-05-15
- [x] [DOCS-103](tickets/DOCS-103-code-review-checklist.md) - Code Review Checklist (2 pts) - ✅ 2026-05-15
- [x] [INFRA-101](tickets/INFRA-101-docker-deployment.md) - Docker & Deployment (5 pts) - ✅ 2026-05-16

**Bonus Features (Not in original roadmap)**
- [x] Ingredients Master CRUD System (~13 pts equivalent) - ✅ 2026-05-15
- [x] Phase-Based Recipe Scoring System (~8 pts equivalent) - ✅ 2026-05-15
- [x] Nutritional Values Display (~3 pts equivalent) - ✅ 2026-05-15
- [x] Menstrual Cycle Tracking (~8 pts equivalent) - ✅ 2026-05-15
- [x] OCR Recipe Upload (~13 pts equivalent) - ✅ 2026-05-15
- [x] Advanced Phase Filter (~2 pts equivalent) - ✅ 2026-05-15

**Maintenance & Quality (Completed)**
- [x] [MAINT-002](tickets/MAINT-002-https-setup-raspberry-pi.md) - HTTPS Setup on Raspberry Pi with Caddy (3 pts) - ✅ 2026-05-19

### 🎯 Ready to Start (Phase 2 - Authentication)

### 📦 Ready (Phase 5 - Documentation & Deployment)
- [ ] [DOCS-102](tickets/DOCS-102-deployment-guide.md) - Deployment Guide (2 pts)

### 🐛 Quality & Code Review Findings (Code Quality Review - 2026-05-16)

**BLOCKER - Must fix before merging:**
- [ ] [BUG-001](tickets/BUG-001-recipe-card-test-german-translation.md) - RecipeCard Test German Translation Mismatch (1 pt)
- [ ] [BUG-002](tickets/BUG-002-failing-ingredient-master-tests.md) - Failing Ingredient Master CRUD Tests (2 pts)
- [ ] [BUG-003](tickets/BUG-003-any-type-in-recipe-list.md) - Unsafe `any` Type in RecipeList (1 pt)
- [ ] [BUG-006](tickets/BUG-006-test-coverage-below-80-percent.md) - Test Coverage Below 80% Target (3 pts)

**SHOULD FIX - High priority:**
- [ ] [BUG-004](tickets/BUG-004-fetch-logic-duplication.md) - Code Duplication in Fetch Logic (DRY) (3 pts)
- [ ] [BUG-005](tickets/BUG-005-magic-strings-in-api-routes.md) - Magic Strings in API Routes (2 pts)

**NICE TO HAVE - Improvements:**
- [ ] [BUG-007](tickets/BUG-007-pagination-logic-not-extracted.md) - Pagination Logic Not Extracted (2 pts)
- [ ] [BUG-008](tickets/BUG-008-incomplete-documentation.md) - Incomplete Documentation (ADRs & Reviews) (3 pts)

### 🐛 Runtime Defects

**BLOCKER - Endpoint returns 500:**
- [ ] [BUG-009](tickets/BUG-009-nutrition-ingredients-route-wrong-table.md) - `/api/nutrition/ingredients` queries non-existent `category` column (2 pts)

---

## 📅 Recommended Implementation Order

**Total Effort**: ~106 story points

### 🏗️ Phase 1: Infrastructure (9 pts)
1. **INFRA-102** - Project Structure (3 pts) - Start here!
2. **TEST-101** - Test Infrastructure (5 pts)
3. **DOCS-103** - Code Review Checklist (1 pt) - Create early for consistency

### 🔐 Phase 2: Authentication (31 pts)
4. **USR-104** - Password Hashing (3 pts)
5. **USR-105** - JWT Tokens (3 pts)
6. **USR-106** - Auth Middleware (2 pts)
7. **USR-101** - User Registration (5 pts)
8. **USR-102** - User Login (5 pts)
9. **USR-103** - User Logout (2 pts)
10. **USR-107** - User Profile (3 pts)
11. **TEST-102** - Auth Tests (5 pts) - Run in parallel with auth features

### 📦 Phase 3a: Database & Recipe CRUD (32 pts)
12. **REC-101** - Database Schema (3 pts)
13. **REC-102** - Create Recipe API (5 pts)
14. **REC-103** - Create Recipe Form (5 pts)
15. **REC-104** - Recipe List (5 pts)
16. **REC-105** - Recipe Detail (3 pts)
17. **REC-106** - Edit Recipe (5 pts)
18. **REC-107** - Delete Recipe (3 pts)
19. **REC-108** - Recipe Validation (3 pts)
20. **TEST-103** - Recipe Tests (8 pts) - Run in parallel with recipe features

### 🔍 Phase 4: Filtering (28 pts)
21. **FLT-101** - Ingredient Extraction (3 pts)
22. **FLT-102** - Filter Component (5 pts)
23. **FLT-103** - Filter Logic (5 pts)
24. **FLT-104** - Real-time Filtering (3 pts)
25. **FLT-105** - Filter State (2 pts)
26. **FLT-106** - Empty States (2 pts)
27. **FLT-107** - Performance (3 pts)
28. **TEST-104** - Filter Tests (5 pts) - Run in parallel with filtering

### 📚 Phase 5: Final Polish (20 pts)
29. **INFRA-101** - Docker Deployment (5 pts)
30. **TEST-105** - E2E Tests (8 pts)
31. **DOCS-101** - API Documentation (3 pts)
32. **DOCS-102** - Deployment Guide (2 pts)

---

## 🔄 Current Status

| Status | Count | Points |
|--------|-------|--------|
| Backlog (Ready) | 1 | 2 |
| Quality Issues (Ready) | 8 | 21 |
| In Progress | 0 | 0 |
| Under Review | 0 | 0 |
| Completed | 30 | 91 |
| **TOTAL** | **40** | **127** |

### Quality Issues Breakdown
| Priority | Count | Points | Examples |
|----------|-------|--------|----------|
| 🔴 BLOCKER | 4 | 7 | BUG-001, BUG-002, BUG-003, BUG-006 |
| 🟡 SHOULD FIX | 2 | 5 | BUG-004 (DRY), BUG-005 (Magic strings) |
| 🟢 NICE TO HAVE | 2 | 5 | BUG-007 (Pagination), BUG-008 (Documentation) |

---

## 📋 How to Work with This Board

### Starting a Ticket
1. Select a ticket from the recommended order
2. Open the ticket file (e.g., `tickets/INFRA-102-project-structure.md`)
3. Read the full acceptance criteria and dependencies
4. Create a git branch: `git checkout -b TICKET-###-description`
5. Update this file to move ticket to "In Progress"

### Completing a Ticket
1. Ensure all acceptance criteria met
2. Run tests: `npm run test:coverage` (ensure 80%+)
3. Run linter: `npm run lint`
4. Create commit with ticket ID: `git commit -m "TICKET-###: Description"`
5. Create PR or request code review
6. After approval, update this file to move ticket to "Completed"

### Parallel Work
Several tickets can be worked in parallel:
- Infrastructure and tests run in parallel
- Auth tests can run while auth features are developed
- Recipe tests can run while recipe features are developed
- Filtering tests can run while filtering is developed

---

## 📊 Velocity & Metrics

### Tracking Progress
- Update this file as tickets complete
- Track actual vs estimated effort
- Calculate velocity after first 20 pts completed

### Test Coverage
- Target: 80%+ code coverage
- Run: `npm run test:coverage`
- Tracked: `.coverage/` directory

### Code Quality
- Linting: `npm run lint` (must pass)
- Type checking: `npm run type-check` (must pass)
- Code review: Use DOCS-103 checklist

---

## 🎯 Epic Breakdown

### Epic 1: User Management & Authentication (31 pts)
**Requirements**: `../requirements/mvp/01-user-management.md`  
**Tickets**: USR-101, USR-102, USR-103, USR-104, USR-105, USR-106, USR-107 + TEST-102

### Epic 2: Recipe Management (32 pts)
**Requirements**: `../requirements/mvp/02-recipe-management.md`  
**Tickets**: REC-101, REC-102, REC-103, REC-104, REC-105, REC-106, REC-107, REC-108 + TEST-103

### Epic 3: Recipe Filtering (28 pts)
**Requirements**: `../requirements/mvp/03-recipe-filtering.md`  
**Tickets**: FLT-101, FLT-102, FLT-103, FLT-104, FLT-105, FLT-106, FLT-107 + TEST-104

### Epic 4: Infrastructure & DevOps (5 pts)
**Tickets**: INFRA-101 (INFRA-102 in Phase 1)

### Epic 5: Testing & Documentation (20 pts)
**Tickets**: TEST-101, TEST-102, TEST-103, TEST-104, TEST-105, DOCS-101, DOCS-102, DOCS-103

---

## ✅ Release Checklist - MVP v1.0

- [ ] All 32 tickets completed
- [ ] All tests passing (80%+ coverage)
- [ ] Arc42 documentation complete
- [ ] Req42 documentation complete (all 3 MVP specs)
- [ ] Code review process validated (DOCS-103 checklist created)
- [ ] Docker deployment tested
- [ ] Performance verified (< 500ms for key operations)
- [ ] Security review completed
- [ ] API documentation complete (DOCS-101)
- [ ] Deployment guide written (DOCS-102)
- [ ] All dependencies resolved
- [ ] Linting passes: `npm run lint`
- [ ] Type checking passes: `npm run type-check`
- [ ] E2E tests passing
- [ ] Ready for Raspberry Pi deployment

---

## 🔗 Key Dependencies Map

```
INFRA-102 ←─┬─ TEST-101 ←─┬─ TEST-102 (Auth)
            │             ├─ TEST-103 (Recipes)
            │             ├─ TEST-104 (Filtering)
            │             └─ TEST-105 (E2E)
            │
            ├─ USR-104 ←─ USR-105 ←─ USR-106
            │  ├─ USR-101, USR-102, USR-103, USR-107
            │  └─ REC-102 ←─ REC-101
            │     ├─ REC-103, REC-104, REC-105
            │     ├─ REC-106, REC-107, REC-108
            │     └─ FLT-101 ←─ FLT-102, FLT-103 ← REC-104
            │        ├─ FLT-104, FLT-105, FLT-106, FLT-107
            │        └─ TEST-104
            │
            └─ INFRA-101 ←─ REC-101 (Database)
               └─ DOCS-102, TEST-105, DOCS-101
```

---

## 📝 Notes

- **Order is Important**: Follow the recommended order to respect dependencies
- **Estimates are Initial**: Refine after completing first 3-4 tickets
- **Parallel Work**: Test tickets can run in parallel with feature development
- **Code Review**: Every ticket must pass code review using DOCS-103 checklist
- **Documentation**: Update Arc42/Req42 as features are completed
- **Testing**: TDD approach - write tests first, then implementation

---

## 🔄 Iteration Planning (When Ready)

After completing Phase 1-2 (Infrastructure + Auth):
- Assess actual vs estimated velocity
- Plan iterations of ~20-25 pts each
- Hold retrospectives to identify learnings
- Update future estimate based on velocity

---

## 📞 Contact & Questions

**Developer**: Matthias Bender  
**Email**: mbender1309@googlemail.com  

**For questions**:
- Ticket-specific: Check ticket file in `tickets/` directory
- Requirements: See `../requirements/mvp/` 
- Architecture: See `../architecture/arc42.md`
