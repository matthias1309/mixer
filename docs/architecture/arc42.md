# Arc42 - Architecture Documentation

## Table of Contents

1. [Introduction and Goals](#introduction-and-goals)
2. [Constraints](#constraints)
3. [Context and Scope](#context-and-scope)
4. [Solution Strategy](#solution-strategy)
5. [Building Block View](#building-block-view)
6. [Runtime View](#runtime-view)
   - 6.1 User Registration Flow
   - 6.2 Recipe Filtering Flow
   - 6.3 Nutrient Calculation Flow
   - 6.4 Login Flow
   - 6.5 Add/Edit Recipe Flow
   - 6.6 Delete Recipe Flow
   - 6.7 Logout Flow
7. [Deployment View](#deployment-view)
8. [Cross-Cutting Concerns](#cross-cutting-concerns)
   - 8.1 Security
   - 8.2 Error Handling
   - 8.3 Performance
   - 8.4 Testing Strategy
   - 8.5 Nutrition Calculation Architecture
   - 8.6 Logging and Monitoring
   - 8.7 Frontend State Management
   - 8.8 API Error Handling & Response Codes
   - 8.9 CI/CD Pipeline & Deployment
   - 8.10 Data Validation Strategy
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
6. **Centralized Unit Conversion**: DB-backed unit table as single source of truth, load-once in-memory Map for fast conversions (see ADR-006)

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
│  │  - /api/recipes/:id/calculate        │  │
│  │  - /api/recipes/:id/scale            │  │
│  │  - /api/nutrition/* (ingredients)    │  │
│  │  - /api/users/* (user profile)       │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │    Business Logic & Calculations     │  │
│  │  - Nutrition engine (calculator)     │  │
│  │  - Unit conversion (UnitConverter)   │  │
│  │  - Recipe scaling (RecipeScaler)     │  │
│  │  - Ingredient management             │  │
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
│   │       ├── route.ts     # GET, PUT, DELETE
│   │       └── calculate/
│   │           └── route.ts # POST - Calculate nutrients
│   ├── nutrition/
│   │   └── ingredients/
│   │       └── route.ts     # GET - List all ingredients
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
│   │   ├── init.ts          # Database initialization
│   │   ├── migrations/      # SQL migrations
│   │   ├── seeds/           # Seed data (ingredients)
│   │   └── models/          # Data models
│   ├── auth/
│   │   ├── jwt.ts           # JWT utilities
│   │   ├── password.ts      # Password hashing
│   │   └── middleware.ts    # Auth middleware
│   ├── nutrition/           # Nutrition module
│   │   ├── types.ts         # Ingredient, Nutrients, RecipeNutrients types
│   │   ├── constants.ts     # Nutrient names, units
│   │   ├── calculator.ts    # Core calculation engine
│   │   └── conversions.ts   # Unit conversion utilities
│   ├── units/               # Unit conversion & scaling module (REC-109)
│   │   ├── types.ts         # Error classes, Unit/ConversionResult interfaces
│   │   ├── constants.ts     # Categories, promotion rules, rounding rules
│   │   ├── converter.ts     # UnitConverter: DB-backed, in-memory conversions
│   │   ├── scaler.ts        # RecipeScaler: pure in-memory scaling
│   │   └── index.ts         # Barrel export
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

### 6.3 Nutrient Calculation Flow (NEW)

```
User              Browser              Server                      Database
  │                 │                    │                            │
  ├──Open recipe───▶│                    │                            │
  │                 │─POST /api/recipes/[id]/calculate──▶             │
  │                 │       { portions: 2 }              │             │
  │                 │       [JWT token]  │─Verify JWT   │             │
  │                 │                    │─Fetch recipe ingredients ──▶
  │                 │                    │◀─recipe_ingredients       │
  │                 │                    │─Fetch ingredient data ────▶
  │                 │                    │◀─ingredient records      │
  │                 │                    │                            │
  │                 │                    │ calculateRecipeNutrients() │
  │                 │                    │ - Iterate ingredients     │
  │                 │                    │ - Apply conversions       │
  │                 │                    │ - Sum all 14 nutrients    │
  │                 │                    │ - Calculate per-portion   │
  │                 │                    │                            │
  │                 │                    │─Store in recipe_nutrients─▶
  │                 │◀─200 + nutrients──│◀─Success                 │
  │                 │ {total_kcal: 500, │                            │
  │                 │  per_portion_kcal:250│                          │
  │                 │  total_protein: 20 │                            │
  │                 │  ...}              │                            │
  │◀─Display nutrition──│                    │                            │
```

### 6.4 Login Flow

```
User                Browser              Server              Database
  │                   │                    │                    │
  ├──Enter login──────▶                    │                    │
  │  form              │─POST /api/auth/login──▶                │
  │                   │  {email, password} │─Validate input    │
  │                   │                    │─Hash input password│
  │                   │                    │─Fetch user ───────▶
  │                   │                    │◀─User record      │
  │                   │                    │─Compare hashes    │
  │                   │                    │─Generate JWT      │
  │                   │◀─200 + JWT token──│                    │
  │                   │─Set httpOnly cookie│                   │
  │◀──Redirect────────│ (sessionToken)     │                    │
```

### 6.5 Add/Edit Recipe Flow

```
User                Browser              Server              Database
  │                   │                    │                    │
  ├──Fill recipe──────▶                    │                    │
  │  form              │                    │                    │
  │                   │─POST /api/recipes ─▶                    │
  │                   │  {name, ingredients│─Verify JWT        │
  │                   │   instructions...} │─Validate data     │
  │                   │  [JWT token]       │─Create recipe ────▶
  │                   │                    │◀─Recipe created   │
  │                   │                    │─Link ingredients──▶
  │                   │                    │◀─Linked          │
  │                   │◀─201 + recipe_id──│                    │
  │◀──Show recipe────│ (redirect to      │                    │
  │                   │  detail view)      │                    │
```

### 6.6 Delete Recipe Flow

```
User                Browser              Server              Database
  │                   │                    │                    │
  ├──Click delete ────▶                    │                    │
  │                   │─DELETE /api/recipes/[id]─▶             │
  │                   │  [JWT token]       │─Verify JWT        │
  │                   │                    │─Check ownership   │
  │                   │                    │─Delete ingredients───▶
  │                   │                    │◀─Deleted          │
  │                   │                    │─Delete recipe ────▶
  │                   │                    │◀─Deleted          │
  │                   │◀─204 No Content───│                    │
  │◀──Redirect ────────│ (to recipes list)  │                    │
```

### 6.7 Logout Flow

```
User                Browser              Server              Database
  │                   │                    │                    │
  ├──Click logout ────▶                    │                    │
  │                   │─POST /api/auth/logout                   │
  │                   │                    │─Clear session      │
  │                   │◀─200 + Set-Cookie─│                    │
  │                   │  (empty cookie)    │                    │
  │◀──Redirect ────────│ (to login page)    │                    │
```

### 6.8 Recipe Scaling Flow (REC-109)

```
User              Browser              Server                        Database
  │                 │                    │                               │
  ├──Set servings──▶│                    │                               │
  │  (e.g. 8)       │─POST /api/recipes/[id]/scale─▶                    │
  │                 │  { newServings: 8 }│─Verify JWT                   │
  │                 │  [JWT token]       │─Validate newServings (1-100) │
  │                 │                    │─Fetch recipe ────────────────▶
  │                 │                    │◀─recipe (with servings)      │
  │                 │                    │─Fetch ingredients ───────────▶
  │                 │                    │◀─ingredients[]               │
  │                 │                    │                               │
  │                 │                    │ scaleFactor = 8 / servings   │
  │                 │                    │ RecipeScaler.scaleIngredient()│
  │                 │                    │ - quantity × scaleFactor     │
  │                 │                    │ - promoteUnit() if needed    │
  │                 │                    │   (3 TL → 1 EL, etc.)       │
  │                 │                    │ - roundQuantity()            │
  │                 │                    │ (no DB writes)               │
  │                 │                    │                               │
  │                 │◀─200 + scaled recipe─                             │
  │                 │  { servings: 8,    │                               │
  │                 │    ingredients: [  │                               │
  │                 │     {name:"Mehl",  │                               │
  │                 │      qty:500,      │                               │
  │                 │      unit:"g"}]}   │                               │
  │◀─Show result───│                    │                               │
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

### 8.5 Nutrition Calculation Architecture (NEW)

**Design Pattern**: Database-driven ingredient management with server-side on-demand calculation

**Components**:

1. **Data Layer** (`src/db/migrations/001_create_nutrition_tables.sql`):
   - `ingredients`: ~300 pre-seeded ingredients with nutrient data per 100g standard
   - `ingredient_conversions`: Unit conversions (grams, pieces, tablespoons, etc.)
   - `recipe_ingredients`: Join table linking recipes to ingredients with amounts
   - `recipe_nutrients`: Cached calculation results (total + per-portion for all 14 nutrients)

2. **Type System** (`src/lib/nutrition/types.ts`):
   - `Ingredient`: Database record with 14 nutrient fields (kcal, protein, fat, etc.)
   - `Nutrients`: Map of all 14 nutrient values (kcal, sugar, fat, protein, carbohydrates, fiber, sodium, calcium, vitamin_d, magnesium, vitamin_b6, vitamin_b12, vitamin_e, zinc)
   - `RecipeNutrients`: Calculation result with total and per-portion values

3. **Calculation Engine** (`src/lib/nutrition/calculator.ts`):
   - `calculateRecipeNutrients()`: Core algorithm
   - For each recipe ingredient: `(baseAmount / ingredient.base_size) * nutrientValue`
   - Handles missing data (null → 0)
   - Normalizes all results to 2 decimal places
   - Per-portion = total / portions

4. **Unit Conversions** (`src/lib/nutrition/conversions.ts`):
   - Predefined conversion factors (grams → base unit multiplier)
   - Supports: grams, pieces (Stück), tablespoons (EL), teaspoons (TL), cups, etc.
   - Formula: `amount * multiplier * ingredient.base_size = baseAmount in grams`
   - Error handling for unknown units

**API Design**:
- `GET /api/nutrition/ingredients`: List all ingredients with nutrient data
- `POST /api/recipes/:id/calculate-nutrients`: Trigger calculation for a recipe
  - Request: `{ portions: number }`
  - Response: `RecipeNutrients` with total and per-portion calculations
  - Stores result in `recipe_nutrients` table for caching

**Performance Considerations**:
- Calculation is on-demand (not background job)
- Results cached in `recipe_nutrients` table
- Single DB call per ingredient (N+1 risk mitigated with prepared statement reuse)
- No external APIs (all data local)
- Suitable for MVP scope (future: consider worker threads for heavy calculation)

**Future Enhancements**:
- Nutrition-based recipe filtering (find recipes matching calorie/macro targets)
- Meal planning with nutritional summaries
- Shopping list with nutritional totals
- User-defined custom ingredients with nutritional data

### 8.6 Logging and Monitoring

**Logging**:
- Console logs for development
- Structured logs (JSON) for production
- Levels: DEBUG, INFO, WARN, ERROR
- Location: stdout (Docker containers capture logs)

**Monitoring** (future):
- Health check endpoint `/api/health`
- Prometheus metrics (later)
- Error tracking (Sentry later)

### 8.7 Frontend State Management

**Pattern**: React Context API with custom hooks

**Architecture**:
- Global state: Ingredient filter selection (recipe filtering)
- Local component state: Form inputs, UI toggles
- Server state: Recipes, user data (managed via API calls)

**Key Components**:
1. **FilterContext** (`src/contexts/FilterContext.tsx`):
   - Manages selected ingredients for recipe filtering
   - Provides `useFilter()` hook for component access
   - Wrapped at root level in `src/app/layout.tsx`

2. **Custom Hooks**:
   - `useFilter()`: Access and manage filter state
   - `useAuth()` (future): Global auth state management
   - `useRecipes()` (future): Recipe data caching

**Data Flow**:
```
Components
  ↓
useFilter() Hook
  ↓
FilterContext (Global State)
  ↓
IngredientFilter Component (updates state)
RecipeList Component (reads state)
```

**Performance Optimization**:
- Filter state relatively static (user-controlled changes only)
- Reasonable number of subscribers
- Can be optimized with `React.memo()` if needed
- Future: Consider Zustand/Redux if complexity grows

**Related**: See [ADR-003](../decisions/ADR-003-context-api-for-ingredient-filter-state.md)

### 8.8 API Error Handling & Response Codes

**Standard Response Format**:

**Success (2xx)**:
```json
{
  "data": {...},
  "status": 200
}
```

**Error (4xx/5xx)**:
```json
{
  "error": "Human-readable error message",
  "status": 400
}
```

**HTTP Status Codes**:

| Code | Meaning | Common Causes |
|------|---------|--------------|
| 200 | OK | Successful GET/PUT request |
| 201 | Created | Resource created successfully |
| 204 | No Content | Successful DELETE (no body) |
| 400 | Bad Request | Validation error, invalid input, missing fields |
| 401 | Unauthorized | Missing/invalid JWT token, expired session |
| 403 | Forbidden | Insufficient permissions (e.g., not recipe creator) |
| 404 | Not Found | Resource doesn't exist (recipe, user, ingredient) |
| 409 | Conflict | Unique constraint violation (e.g., duplicate email) |
| 500 | Server Error | Unhandled exception, database error |

**Validation Error Pattern**:
```json
{
  "error": "Validation failed",
  "details": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Must be at least 8 characters" }
  ]
}
```

**Complete API Documentation**: See [docs/api.md](../api.md) for all endpoints, request/response examples, and error codes.

### 8.9 CI/CD Pipeline & Deployment

**Development Workflow**:
1. **Local Development**: `npm run dev` (Next.js dev server on port 3000)
2. **Testing**: `npm test` (Jest unit/integration tests)
3. **Linting**: `npm run lint` (ESLint code quality checks)
4. **Build**: `npm run build` (Production Next.js build)

**Production Deployment**:
- **Container**: Docker image built from `Dockerfile`
- **Orchestration**: Docker Compose on Raspberry Pi
- **Database**: PostgreSQL container with persistent volume
- **Reverse Proxy**: Nginx (optional, for SSL/TLS)
- **Deployment Command**: `docker-compose up -d`

**Deployment Diagram**:
```
Code pushed to repository
    ↓
GitHub / Git server detects push
    ↓
(Future: Automated build trigger)
    ↓
Docker build: npm install → npm run build
    ↓
Docker image created
    ↓
Push to Raspberry Pi
    ↓
docker-compose pull
docker-compose up -d
    ↓
Application running (accessible at raspberrypi.local)
```

**Environment Configuration**:
- `.env.local`: Local development (SQLite)
- `.env.production`: RPi production (PostgreSQL)
- Docker secrets (production JWT_SECRET, DB passwords)

**Health Checks** (future):
- `/api/health` endpoint for monitoring
- Database connection verification
- Health check in docker-compose.yml

**Future CI/CD Enhancements**:
- GitHub Actions or GitLab CI for automated testing
- Automated building/pushing to RPi
- Database migration automation
- Rollback strategy for failed deployments

**Related Files**:
- `Dockerfile` (container image)
- `docker-compose.yml` (production RPi)
- `docker-compose.local.yml` (local development)
- `.env.local.example` (environment template)

### 8.10 Data Validation Strategy

**Frontend Validation**:
- Real-time field validation (email format, password strength)
- User-friendly error messages
- Form submit disabled while errors exist
- Used for UX, not security

**Backend Validation** (enforced):
- Email format and uniqueness
- Password length and strength requirements
- Recipe name/description length limits
- Ingredient quantity must be positive
- All numeric fields validated for bounds
- Type checking via TypeScript

**Database Constraints** (last-line defense):
- NOT NULL constraints on required fields
- UNIQUE constraints on email, ingredient name
- FOREIGN KEY constraints for referential integrity
- CHECK constraints for value ranges

**Validation Order**:
1. Frontend: Immediate user feedback
2. Backend: Security enforcement, data integrity
3. Database: Physical constraints enforcement

**Related**: See ADR-005 for testing validation logic

---

## 9. Architecture Decisions

All architecture decisions are documented as Architecture Decision Records (ADRs) in `docs/decisions/`. ADRs follow the format: decision context, decision, consequences, and alternatives considered.

### 9.1 Accepted Decisions

#### ADR-001: JWT Authentication with Refresh Tokens
**Status**: Accepted  
**Key Points**:
- Stateless JWT-based authentication with refresh token rotation
- Tokens stored in httpOnly cookies for security
- Supports multi-device/multi-tab scenarios
- Access tokens: 24-hour expiration
- **Files**: `src/lib/auth/tokenRefresh.ts`, `src/lib/auth/jwt.ts`, `src/app/api/auth/*`

#### ADR-002: SQLite and PostgreSQL Dual-Database Support
**Status**: Accepted  
**Key Points**:
- SQLite for local development (zero configuration)
- PostgreSQL for production on Raspberry Pi
- Database selection via `DATABASE_URL` environment variable
- Models use raw SQL with prepared statements (no ORM)
- Schema migrations in `src/lib/db/migrations/`
- Tested for SQL dialect compatibility
- **Files**: `src/lib/db/init.ts`, `src/lib/db/connection.ts`, `src/lib/db/models/`

#### ADR-003: Context API for Ingredient Filter State
**Status**: Accepted  
**Key Points**:
- React Context API for global filter state management
- Eliminates prop drilling across component hierarchy
- Custom `useFilter()` hook for consuming state
- Suitable for MVP phase (can migrate to Redux later if needed)
- **Files**: `src/contexts/FilterContext.tsx`, `src/hooks/useFilter.ts`

#### ADR-004: Next.js App Router (over Pages Router)
**Status**: Accepted  
**Key Points**:
- Modern file-based routing under `app/` directory
- Server Components by default for better performance
- Route groups for logical organization without URL impact
- Improved API route organization
- Nested layouts for shared UI
- **Files**: `src/app/`, `src/middleware.ts`

#### ADR-005: Test-Driven Development with Jest
**Status**: Accepted  
**Key Points**:
- Write tests BEFORE implementation code
- Minimum 80% code coverage requirement
- Jest for unit/integration tests
- React Testing Library for component tests
- Cypress for E2E tests
- Test organization: `src/__tests__/unit/`, `src/__tests__/integration/`, `tests/e2e/`
- **Files**: `jest.config.js`, `src/__tests__/`, `tests/`

### 9.2 Future Decision Candidates

- **Caching Strategy**: Redis for recipe caching (when performance becomes critical)
- **Scalability**: When RPi constraints are reached, consider separate backend service
- **State Management**: Migrate from Context API to Redux if state complexity grows
- **API Documentation**: OpenAPI/Swagger integration for automated API docs

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
| **Arc42** | Architecture documentation framework (12-section template) |
| **Req42** | Requirements documentation framework |
| **ADR** | Architecture Decision Record - documents rationale for technical decisions |
| **JWT** | JSON Web Token - stateless, cryptographically signed authentication token |
| **Refresh Token** | Long-lived token used to obtain new access tokens (supports token rotation) |
| **httpOnly Cookie** | Browser cookie inaccessible to JavaScript (prevents XSS token theft) |
| **TDD** | Test-Driven Development - write tests before implementation code |
| **DRY** | Don't Repeat Yourself - avoid code duplication |
| **KISS** | Keep It Simple, Stupid - prefer simple, understandable code |
| **YAGNI** | You Aren't Gonna Need It - no over-engineering for hypothetical requirements |
| **RPi** | Raspberry Pi - ARM-based single-board computer |
| **MVP** | Minimum Viable Product - minimal feature set to meet core requirements |
| **SOLID** | Design principles: Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion |
| **Context API** | React feature for managing global state without prop drilling |
| **Server Component** | Next.js component rendered on server (default in App Router) |
| **Route Group** | Next.js convention `(groupName)` for organizing routes without URL impact |
| **Prepared Statement** | SQL query with parameterized placeholders (prevents SQL injection) |
| **N+1 Query Problem** | Performance issue when fetching related data results in N+1 queries |
| **Nutrition Calculation** | On-demand server-side computation of recipe nutrients from ingredient data |
| **Unit Conversion** | Translation between measurement units (grams, pieces, tablespoons, etc.) |

---

## Related Documentation

This Arc42 document provides the overall architecture overview. For detailed information, see:

- **[API Documentation](../api.md)**: Complete REST API reference with all endpoints, request/response formats, and error codes
- **[Architecture Decision Records](../decisions/)**: Detailed rationale for all major technical decisions
  - ADR-001: JWT Authentication with Refresh Tokens
  - ADR-002: SQLite and PostgreSQL Dual-Database Support
  - ADR-003: Context API for Ingredient Filter State
  - ADR-004: Next.js App Router over Pages Router
  - ADR-005: Test-Driven Development with Jest
- **[Requirements](../requirements/)**: Functional and non-functional requirements documented with Req42
- **[Code Review Reports](../code-reviews/)**: Learnings from code reviews and quality assessments
- **[Implementation Status](../code-reviews/implementation-status.md)**: Current feature status and progress
- **[CLAUDE.md](./../.claude/CLAUDE.md)**: Project guidelines and development methodology
- **[Roadmap](../roadmap/kanban.md)**: Feature planning and phase timeline

---

## Document Information

- **Version**: 1.2
- **Last Updated**: 2026-05-19
- **Status**: Active
- **Review Frequency**: Quarterly or after major architecture changes
- **Next Review**: 2026-08-19

## Recent Changes (v1.2)

- **Expanded Runtime View**: Added 5 new flow diagrams (Login, Add/Edit Recipe, Delete Recipe, Logout)
- **Detailed ADRs**: Documented all 5 accepted Architecture Decision Records (ADR-001 through ADR-005)
- **Frontend State Management**: Added comprehensive section on React Context API pattern
- **API Error Handling**: Documented HTTP status codes, error formats, and complete API reference link
- **Data Validation**: Added three-layer validation strategy (frontend, backend, database)
- **Expanded Glossary**: Added 10+ new terms (ADR, JWT, Refresh Token, Context API, etc.)
- **Navigation**: Updated Table of Contents with subsections

## Recent Changes (v1.1)

- Added Nutrition Module architecture (Section 5, 6.3, 8.5)
- Documented ingredient database with pre-seeded data (~300 ingredients)
- Added nutrient calculation flow and API design
- Included unit conversion system and type definitions
- Updated building block view with nutrition components
