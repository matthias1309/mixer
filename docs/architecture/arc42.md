# Arc42 - Architecture Documentation

## Table of Contents

1. [Introduction and Goals](#introduction-and-goals)
2. [Constraints](#constraints)
3. [Context and Scope](#context-and-scope)
4. [Solution Strategy](#solution-strategy)
5. [Building Block View](#building-block-view)
6. [Runtime View](#runtime-view)
7. [Deployment View](#deployment-view)
8. [Cross-Cutting Concerns](#cross-cutting-concerns)
9. [Architecture Decisions](#architecture-decisions)
10. [Quality Requirements](#quality-requirements)
11. [Risks and Technical Debt](#risks-and-technical-debt)
12. [Glossary](#glossary)

---

## 1. Introduction and Goals

### 1.1 What is the Recipe Manager?

Recipe Manager is a multi-user web application that helps users manage their recipe collection and discover recipes they can cook based on ingredients they have on hand.

### 1.2 Business Goals

- Enable users to create and manage a personal recipe collection
- Allow users to filter recipes by available ingredients
- Support multi-user access with secure authentication
- Provide a simple, intuitive interface accessible from any device
- Deploy efficiently on resource-constrained Raspberry Pi hardware

### 1.3 Architectural Goals

- **Simplicity**: Keep the architecture straightforward and maintainable
- **Scalability**: Support multiple concurrent users
- **Performance**: Responsive UI even on limited RPi hardware
- **Testability**: Enable comprehensive automated testing (80%+ coverage)
- **Maintainability**: Clear separation of concerns, DRY principles
- **Security**: Secure authentication and data isolation per user

### 1.4 Requirements Overview

**Functional Requirements**:
- User registration and authentication
- Recipe CRUD operations
- Recipe ingredient management
- Filtering recipes by available ingredients

**Non-Functional Requirements**:
- Sub-second response times for common operations
- Support 10+ concurrent users on RPi
- 80%+ code coverage
- Lean documentation (growing with features)

---

## 2. Constraints

### 2.1 Technical Constraints

- **Deployment Platform**: Raspberry Pi with Docker
- **Database**: SQLite (local dev), PostgreSQL (production)
- **Frontend Framework**: Next.js with React
- **Backend Runtime**: Node.js
- **Language**: English for all code and documentation
- **Documentation Format**: Markdown only

### 2.2 Organizational Constraints

- **Development Process**: V-Model with TDD
- **Code Review**: Local review with clean code focus (DRY, KISS, YAGNI)
- **Minimum Test Coverage**: 80%
- **Communication**: German with developer
- **Testing Stack**: Jest + React Testing Library + Cypress

### 2.3 Hardware Constraints

- **CPU**: ARM processor (RPi)
- **Memory**: Limited RAM (~1-4GB typical)
- **Storage**: Limited disk space
- **Network**: Local network deployment

---

## 3. Context and Scope

### 3.1 System Context Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       External Systems                       │
│                                                              │
│  ┌─────────────┐                          ┌──────────────┐ │
│  │ Future:    │                          │ Future:      │ │
│  │ Recipe API │                          │ Photo Parser │ │
│  │ Integration │                          │ (ML/OCR)    │ │
│  └─────────────┘                          └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ (Future)
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Recipe Manager                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Next.js Full-Stack Application             │   │
│  │  (Frontend + Backend in single codebase)             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ HTTP/HTTPS
                              │
                    ┌─────────┴─────────┐
                    │                   │
            ┌───────▼────────┐  ┌──────▼─────────┐
            │   Web Browser  │  │  Mobile Browser│
            │   (Desktop)    │  │   (Mobile)     │
            └────────────────┘  └────────────────┘
                    ▲                   ▲
                    │ (Users)           │
                    └─────────┬─────────┘
                              │
                        ┌─────▼──────┐
                        │   Users    │
                        └────────────┘
```

### 3.2 Business Context

**Users**: Home cooks who want to manage their recipe collection

**Primary Use Cases**:
1. Register and create an account
2. Add recipes to their collection
3. View their recipes
4. Filter recipes by available ingredients
5. View recipe details (ingredients, instructions)

**Future Use Cases** (not in MVP):
- Filter by nutritional values
- Import recipes from external sources
- Meal planning
- Shopping list generation

---

## 4. Solution Strategy

### 4.1 Technology Choices

**Frontend**:
- Next.js (React framework with built-in SSR, routing, API integration)
- TypeScript (type safety)
- React Testing Library (component testing)
- Cypress (E2E testing)

**Backend**:
- Next.js API Routes (Node.js)
- JWT for stateless authentication
- TypeScript

**Database**:
- SQLite for local development (zero setup)
- PostgreSQL for production on RPi

**Deployment**:
- Docker containers for consistency
- Docker Compose for local and production orchestration

### 4.2 Architecture Pattern

**Full-Stack Monolith**: 
A single Next.js application that handles both frontend and backend. This is chosen over separate frontend/backend because:
- Simpler deployment on RPi (single Docker container)
- Reduced operational complexity
- Faster development iteration
- Sufficient for MVP scope
- Can be split later if needed

### 4.3 Key Design Decisions

1. **JWT Authentication**: Stateless, suitable for distributed systems and simple to implement
2. **SQLite → PostgreSQL Migration**: SQLite for dev simplicity, PostgreSQL for production reliability
3. **Lean Documentation**: Grow documentation with features (Arc42/Req42), not upfront
4. **TDD Approach**: Write tests first to ensure quality and maintainability
5. **Code Review Focus**: Clean code principles (DRY, KISS, YAGNI) guide all reviews

---

## 5. Building Block View

### 5.1 Level 1: High-Level Architecture

```
┌─────────────────────────────────────────────┐
│         Next.js Application (Docker)        │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │      React Frontend (Pages/Views)    │  │
│  │  - Login/Register Pages              │  │
│  │  - Recipe List View                  │  │
│  │  - Recipe Detail View                │  │
│  │  - Add Recipe Form                   │  │
│  │  - Ingredient Filter Component       │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │     Next.js API Routes (Backend)     │  │
│  │  - /api/auth/* (login, register)     │  │
│  │  - /api/recipes/* (CRUD operations)  │  │
│  │  - /api/users/* (user profile)       │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │      Middleware & Utilities          │  │
│  │  - JWT verification                  │  │
│  │  - Database client                   │  │
│  │  - Type definitions                  │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
              ▲              ▲
              │              │
        HTTP │              │ SQL
              │              │
        ┌─────▼──────────────▼─────┐
        │   PostgreSQL Database    │
        │  (or SQLite in dev)      │
        └──────────────────────────┘
```

### 5.2 Level 2: Component Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication layout group
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (dashboard)/         # Main application layout group
│   │   ├── recipes/
│   │   ├── profile/
│   │   ├── add-recipe/
│   │   └── layout.tsx
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
│
├── api/
│   ├── auth/
│   │   ├── login.ts
│   │   ├── register.ts
│   │   └── logout.ts
│   ├── recipes/
│   │   ├── route.ts         # GET (list), POST (create)
│   │   └── [id]/
│   │       └── route.ts     # GET, PUT, DELETE
│   └── users/
│       └── profile.ts
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── recipe/
│   │   ├── RecipeCard.tsx
│   │   ├── RecipeList.tsx
│   │   ├── RecipeDetail.tsx
│   │   ├── AddRecipeForm.tsx
│   │   └── IngredientFilter.tsx
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Navigation.tsx
│   │   └── LoadingSpinner.tsx
│   └── layout/
│       └── Container.tsx
│
├── lib/
│   ├── api/
│   │   ├── client.ts        # API client helper
│   │   └── endpoints.ts     # API routes
│   ├── db/
│   │   ├── client.ts        # Database connection
│   │   ├── queries.ts       # Database queries
│   │   └── migrations.ts    # Schema migrations
│   ├── auth/
│   │   ├── jwt.ts           # JWT utilities
│   │   ├── password.ts      # Password hashing
│   │   └── middleware.ts    # Auth middleware
│   └── utils/
│       ├── validation.ts
│       ├── helpers.ts
│       └── constants.ts
│
├── types/
│   ├── auth.ts
│   ├── recipe.ts
│   ├── user.ts
│   ├── api.ts
│   └── index.ts
│
├── styles/
│   ├── globals.css
│   └── variables.css
│
└── __tests__/
    ├── unit/
    │   ├── auth/
    │   ├── recipe/
    │   └── lib/
    └── integration/
        └── api/
```

---

## 6. Runtime View

### 6.1 User Registration Flow

```
User                Browser              Server              Database
  │                   │                    │                    │
  ├──Register form──▶ │                    │                    │
  │                   │─Submit POST request─▶                   │
  │                   │  /api/auth/register │                    │
  │                   │                    │─Validate input     │
  │                   │                    │─Hash password      │
  │                   │                    │─Create user record─▶
  │                   │                    │◀─User created     │
  │                   │                    │─Generate JWT      │
  │                   │◀─201 + JWT token──│                    │
  │                   │─Store token      │                    │
  │◀──Redirect────────│                    │                    │
```

### 6.2 Recipe Filtering Flow

```
User                Browser              Server              Database
  │                   │                    │                    │
  ├──Select ingredients──▶                 │                    │
  │                   │─GET /api/recipes──▶                    │
  │                   │  ?ingredients=x,y,z│                    │
  │                   │  [JWT token]      │─Verify JWT        │
  │                   │                    │─Query recipes ───▶
  │                   │                    │  filtered by user  │
  │                   │                    │  and ingredients   │
  │                   │                    │◀─Matching recipes│
  │                   │◀──200 + JSON array─│                    │
  │                   │─Render recipe list│                    │
  │◀──Show results────│                    │                    │
```

---

## 7. Deployment View

### 7.1 Local Development

```
┌─────────────────────────────────────────────┐
│      Developer's Machine                    │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  npm run dev                          │  │
│  │  - Next.js dev server (port 3000)     │  │
│  │  - Hot reload on code changes         │  │
│  │  - Source map debugging               │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │  SQLite Database                      │  │
│  │  .data/app.db (git-ignored)           │  │
│  └───────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

### 7.2 Production on Raspberry Pi

```
┌──────────────────────────────────────────────────────┐
│              Raspberry Pi                            │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │            Docker Compose                      │ │
│  │                                                │ │
│  │  ┌──────────────────────────────────────────┐ │ │
│  │  │  Next.js Container                       │ │ │
│  │  │  - Application (port 3000)                │ │ │
│  │  │  - Nginx reverse proxy (port 80/443)      │ │ │
│  │  └──────────────────────────────────────────┘ │ │
│  │                                                │ │
│  │  ┌──────────────────────────────────────────┐ │ │
│  │  │  PostgreSQL Container                    │ │ │
│  │  │  - Database (port 5432, internal only)    │ │ │
│  │  │  - Persistent volume for data             │ │ │
│  │  └──────────────────────────────────────────┘ │ │
│  │                                                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │  Volumes                                       │ │
│  │  - postgres_data (database persistence)        │ │
│  │  - logs (application logs)                     │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
              ▲
              │ HTTP/HTTPS
              │
       ┌──────┴────────┐
       │               │
   Desktop          Mobile
   Browser          Browser
```

### 7.3 Docker Deployment Commands

```bash
# Build
docker build -t recipe-manager:latest .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

## 8. Cross-Cutting Concerns

### 8.1 Security

**Authentication Architecture**:

The application uses stateless JWT-based authentication implemented in two layers:

1. **Password Hashing Layer** (`src/lib/auth/password.ts` - USR-104):
   - Passwords hashed with bcryptjs (cost factor 10)
   - Async hashing prevents event loop blocking
   - Functions: `hashPassword(password): Promise<string>`, `verifyPassword(password, hash): Promise<boolean>`
   - Never stored or logged in plain text
   - Salted automatically by bcrypt

2. **JWT Token Layer** (`src/lib/auth/jwt.ts` - USR-105):
   - JWT tokens created with `generateToken(userId, email): string`
   - Token payload includes: `userId`, `email`, `iat` (issued-at), `exp` (expiration)
   - Tokens verified with `verifyToken(token): JWTPayload | null`
   - Decoding without verification available via `decodeToken(token): JWTPayload | null`
   - Expiration: 24 hours (configurable via `JWT_EXPIRATION` env var)
   - Secret key: from `JWT_SECRET` env var (minimum 32 characters enforced)

**Authentication Flow**:
- User registers with email + password → password hashed → user stored in DB
- User logs in → credentials verified → JWT generated → stored in httpOnly cookie
- Protected requests → JWT extracted from cookie → verified → request proceeds
- Token expiration → 401 Unauthorized → user redirected to login

**Authorization**:
- API endpoints verify JWT and user ownership of resources
- Users can only access/modify their own recipes and profile
- Protected routes middleware validates JWT on every request

**JWT Secret Management**:
- Required: minimum 32 characters (enforced at runtime)
- Should be: strong random string, never committed to repo
- Environment: `process.env.JWT_SECRET` (set in .env.local or Docker secrets)
- Validation: throws error if missing or too short (fail-fast pattern)

**API Security**:
- HTTPS enforced in production
- CORS configured to allow local/RPi access
- httpOnly cookies prevent XSS token theft
- Rate limiting on auth endpoints (future)
- No plain-text tokens in logs or responses

### 8.2 Error Handling

**Approach**: Consistent error responses across API

```typescript
// Success
{ status: 200, data: {...} }

// Client Error
{ status: 400, error: "Invalid input", details: {...} }

// Server Error
{ status: 500, error: "Internal server error" }
```

**Logging**: Errors logged with context for debugging

### 8.3 Performance

**Database**:
- Indexes on frequently queried columns (user_id, recipe_id)
- N+1 query prevention through proper JOINs

**Frontend**:
- Next.js automatic code splitting
- Image optimization
- CSS-in-JS or Tailwind for minimal CSS

**Caching** (future):
- Browser caching for static assets
- Server-side recipe caching (Redis later if needed)

### 8.4 Testing Strategy

**Unit Tests** (Jest):
- Business logic, utilities, helpers
- Target: 80%+ coverage
- Location: `src/__tests__/unit/`

**Integration Tests** (Jest + API):
- API endpoints
- Database interactions
- Auth flows
- Location: `src/__tests__/integration/`

**E2E Tests** (Cypress):
- Complete user flows (register → login → add recipe → filter)
- Visual regressions (future)
- Location: `tests/e2e/`

### 8.5 Logging and Monitoring

**Logging**:
- Console logs for development
- Structured logs (JSON) for production
- Levels: DEBUG, INFO, WARN, ERROR
- Location: stdout (Docker containers capture logs)

**Monitoring** (future):
- Health check endpoint `/api/health`
- Prometheus metrics (later)
- Error tracking (Sentry later)

---

## 9. Architecture Decisions

See `docs/decisions/` for Architecture Decision Records (ADRs).

**Key Decisions**:
1. **ADR-001**: Full-Stack Next.js over separate frontend/backend
2. **ADR-002**: JWT authentication over session-based
3. **ADR-003**: SQLite → PostgreSQL migration path
4. **ADR-004**: Lean documentation (Arc42/Req42) over comprehensive upfront docs

---

## 10. Quality Requirements

### 10.1 Functional Correctness

- All use cases from requirements must work as specified
- Tests must validate happy paths and edge cases

### 10.2 Code Quality

**Metrics**:
- Code coverage: ≥80%
- Cyclomatic complexity: ≤10 per function
- Duplication: <5%

**Principles**:
- DRY: No code duplication
- KISS: Simple, understandable code
- YAGNI: No over-engineering

### 10.3 Performance

- API response time: <500ms for typical requests
- Page load time: <2s on RPi
- Support ≥10 concurrent users

### 10.4 Security

- No SQL injection vulnerabilities
- No XSS vulnerabilities
- No sensitive data in logs
- Passwords securely hashed
- JWT tokens properly validated

### 10.5 Maintainability

- Code is self-documenting (clear naming)
- Minimal comments (only for why, not what)
- Tests serve as documentation
- Architecture decisions recorded in ADRs

---

## 11. Risks and Technical Debt

### 11.1 Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| SQLite performance issues at scale | Medium | Medium | Migrate to PostgreSQL early |
| RPi memory constraints | Medium | High | Monitor resource usage, optimize queries |
| JWT token theft | Low | High | Use httpOnly cookies, HTTPS |
| Over-engineering early | High | Medium | Strict YAGNI in reviews |

### 11.2 Technical Debt

- **Initial**: Minimal, using Req42 and Arc42 to avoid architectural debt
- **Tracking**: Recorded in ADRs and code review learnings
- **Strategy**: Refactor before adding features if debt impacts development velocity

---

## 12. Glossary

| Term | Definition |
|------|-----------|
| **Arc42** | Architecture documentation framework |
| **Req42** | Requirements documentation framework |
| **JWT** | JSON Web Token - stateless authentication |
| **TDD** | Test-Driven Development - write tests first |
| **DRY** | Don't Repeat Yourself - avoid code duplication |
| **KISS** | Keep It Simple, Stupid - prefer simplicity |
| **YAGNI** | You Aren't Gonna Need It - no over-engineering |
| **RPi** | Raspberry Pi |
| **MVP** | Minimum Viable Product |
| **SOLID** | Design principles (Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion) |

---

## Document Information

- **Version**: 1.0
- **Last Updated**: 2026-05-09
- **Status**: Active
- **Review Frequency**: Quarterly or after major architecture changes
- **Next Review**: 2026-08-09
