# Recipe Manager - Complete Design & Architecture

**Date**: 2026-05-14  
**Version**: 1.0  
**Status**: Design Review  
**Owner**: Matthias Bender

---

## 1. Executive Summary

Recipe Manager is a **community-based recipe sharing and filtering application** where:
- **All users see all recipes** (community database)
- **Each user can create recipes**, but only edit/delete their own
- **Recipes are deduplicated** — identical recipes from multiple users appear once
- **Filtering by ingredients** works across all community recipes
- **Authentication** uses JWT tokens with sliding-window refresh (1h inactivity timeout)

### Key Architectural Decisions
1. **Approach B**: Community recipes with canonical linking (single record per unique recipe)
2. **Pattern B**: Sliding-window token refresh (auto-refresh on each request, 1h timeout)
3. **Performance**: Indexed queries, efficient filtering, pagination (10 per page)
4. **Security**: XSS protection, SQL injection prevention, HTTPS, httpOnly cookies

---

## 2. System Architecture

### 2.1 High-Level Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Pages: Login, Register, Dashboard, RecipeDetail      │   │
│  │ Components: RecipeList, IngredientFilter, Forms      │   │
│  │ State: Auth Context, Filter State (React Context)   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/HTTPS
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Backend (Next.js API Routes)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Auth Middleware: JWT validation, token refresh       │   │
│  │ Routes: /api/auth/*, /api/recipes/*, /api/filter/*  │   │
│  │ Business Logic: Recipe CRUD, Deduplication, Filter  │   │
│  │ Security: Input validation, XSS escaping, SQL preps │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │ SQL
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Database (SQLite local / PostgreSQL prod)       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Tables: users, recipes, ingredients, recipe_ingredi │   │
│  │ Indexes: recipe lookup, ingredient search, owner     │   │
│  │ Constraints: PK, FK, NOT NULL, unique where needed  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### 3.1 Users Table

**Purpose**: Store user accounts and authentication data

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

**Fields**:
- `id`: Unique user identifier
- `email`: User's email (unique, used for login)
- `password_hash`: Bcrypt-hashed password (never plain text)
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

**Constraints**:
- `email` is UNIQUE (prevents duplicate accounts)
- `password_hash` is NOT NULL
- Primary key on `id`

---

### 3.2 Recipes Table

**Purpose**: Store all recipes in the community database

```sql
CREATE TABLE recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  instructions TEXT,
  servings INTEGER DEFAULT 1,
  creator_id INTEGER NOT NULL,
  canonical_id INTEGER,
  is_duplicate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (canonical_id) REFERENCES recipes(id)
);

CREATE INDEX idx_recipes_creator ON recipes(creator_id);
CREATE INDEX idx_recipes_name ON recipes(name);
CREATE INDEX idx_recipes_canonical ON recipes(canonical_id);
```

**Fields**:
- `id`: Unique recipe identifier
- `name`: Recipe name (1-100 chars, required)
- `description`: Recipe description (optional, max 500 chars)
- `instructions`: Cooking instructions (optional, max 2000 chars)
- `servings`: Serving size (optional, default 1)
- `creator_id`: User who created this recipe record (FK to users)
- `canonical_id`: If not NULL, this recipe is a duplicate of another (FK to recipes)
- `is_duplicate`: Boolean flag (true if canonical_id is not NULL)
- `created_at`, `updated_at`: Timestamps

**Key Concept — Community Recipes with Deduplication**:
- When User1 creates "Spaghetti Carbonara" → Recipe stored with `canonical_id = NULL` (original)
- When User2 creates identical "Spaghetti Carbonara" → Recipe stored with `canonical_id = 1` (duplicate)
- **List query**: `SELECT * FROM recipes WHERE canonical_id IS NULL` (shows only originals)
- **Detail query**: Can show either original or duplicate (both point to same canonical recipe)

---

### 3.3 Ingredients Table

**Purpose**: Store ingredients used in recipes

```sql
CREATE TABLE ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50),
  
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE INDEX idx_ingredients_recipe ON ingredients(recipe_id);
CREATE INDEX idx_ingredients_name ON ingredients(name);
```

**Fields**:
- `id`: Unique ingredient identifier
- `recipe_id`: Recipe this ingredient belongs to (FK to recipes, CASCADE delete)
- `name`: Ingredient name (normalized: trim, single spaces, lowercase for matching)
- `quantity`: Amount needed (decimal)
- `unit`: Unit of measurement (g, ml, tbsp, tsp, cup, etc. — optional)

**Normalization**:
- Names stored as-is but **compared as normalized** (lowercase, trimmed, single spaces)
- Example: "olive  oil" stored but matched as "olive oil"

---

### 3.4 Recipe Ingredients (Many-to-Many)

**Purpose**: Link recipes to ingredients (one recipe has many ingredients)

The `ingredients` table already handles this (one-to-many from recipes).

---

### 3.5 Database Constraints & Integrity

| Table | Constraint | Reason |
|-------|-----------|--------|
| users | email UNIQUE | One account per email |
| users | password NOT NULL | All users must have password |
| recipes | creator_id NOT NULL | All recipes have a creator |
| recipes | name NOT NULL | Recipe must have a name |
| recipes | name NOT EMPTY | Recipe name at least 1 char |
| ingredients | recipe_id FK | Link to parent recipe |
| ingredients | recipe_id ON DELETE CASCADE | Delete ingredients when recipe deleted |

---

## 4. API Endpoints

### 4.1 Authentication Endpoints

#### POST /api/auth/register

**Purpose**: Create new user account

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Validation**:
- email: valid email format, max 255 chars, unique
- password: min 8 chars

**Response (201 Created)**:
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com"
  },
  "token": "eyJhbGc..."
}
```

**Response (400 Bad Request)**:
```json
{
  "error": "Email already exists" | "Password too short"
}
```

**Security**:
- Password hashed with bcrypt (cost 10)
- Email validated & escaped
- Errors don't leak information (generic "Email already exists")

---

#### POST /api/auth/login

**Purpose**: Authenticate user and issue JWT token

**Request**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK)**:
- Sets `Set-Cookie: sessionToken=<JWT>; HttpOnly; Secure; SameSite=Strict`
- Body: User info (no token in body, only in cookie)

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": "Invalid email or password"
}
```

**Token Details**:
- JWT with 1-hour TTL
- httpOnly cookie (secure flag in production)
- Automatically refreshed on each API request
- Sliding window: each request extends TTL by 1 hour

---

#### POST /api/auth/logout

**Purpose**: Clear session and invalidate token

**Response (200 OK)**:
- Clears `sessionToken` cookie
- Returns success message

```json
{
  "message": "Logged out successfully"
}
```

---

### 4.2 Recipe Endpoints

#### GET /api/recipes

**Purpose**: List all recipes (community database) with pagination and search

**Query Parameters**:
- `page`: Page number (default 1)
- `sort`: Sort by `date` | `name` | `ingredients` (default `date`)
- `search`: Search recipes by name (optional)
- `ingredients`: Filter by ingredients comma-separated (optional, AND logic)

**Response (200 OK)**:
```json
{
  "recipes": [
    {
      "id": 1,
      "name": "Spaghetti Carbonara",
      "description": "Classic Italian pasta...",
      "creatorName": "Matthias",
      "ingredientCount": 5,
      "createdAt": "2026-05-14T10:00:00Z"
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 10,
  "totalPages": 5
}
```

**Query Logic**:
```sql
SELECT recipes.id, recipes.name, recipes.description, users.email as creatorName, 
       COUNT(ingredients.id) as ingredientCount, recipes.created_at
FROM recipes
JOIN users ON recipes.creator_id = users.id
LEFT JOIN ingredients ON recipes.id = ingredients.recipe_id
WHERE recipes.canonical_id IS NULL  -- Only show originals
  AND (recipes.name LIKE ? OR ? IS NULL)  -- Search filter
  AND (filtered by ingredients if provided)  -- Ingredient filter
GROUP BY recipes.id
ORDER BY (sort by parameter)
LIMIT 10 OFFSET (page-1)*10;
```

**Implementation Notes**:
- Pagination: 10 recipes per page
- Sorting: database-level sorting
- Searching: case-insensitive LIKE query
- Ingredient filter: JOIN on ingredients, check ALL selected are present
- Performance: indexes on `canonical_id`, `name`, ingredient names

---

#### POST /api/recipes

**Purpose**: Create new recipe (with deduplication check)

**Request**:
```json
{
  "name": "Spaghetti Carbonara",
  "description": "Classic Italian pasta",
  "instructions": "1. Boil pasta... 2. Mix eggs...",
  "servings": 4,
  "ingredients": [
    {
      "name": "Spaghetti",
      "quantity": 400,
      "unit": "g"
    },
    {
      "name": "Eggs",
      "quantity": 3,
      "unit": null
    }
  ]
}
```

**Validation**:
- name: required, 1-100 chars
- description: optional, max 500 chars
- instructions: optional, max 2000 chars
- servings: optional, positive integer, default 1
- ingredients: optional array, max 50 items
- Each ingredient: name (required, 1-100 chars), quantity (required, positive), unit (optional)

**Deduplication Logic**:
```
1. Normalize recipe data (name lowercase, trim)
2. Normalize all ingredient names (lowercase, trim)
3. Check if recipe already exists:
   - Same name
   - Same ingredients (exact match, case-insensitive, count)
   - Same instructions (case-insensitive)
4. If exists:
   - Create recipe record with canonical_id = existing_recipe.id
   - Return existing recipe (or new record? TBD)
5. If not exists:
   - Create recipe record with canonical_id = NULL (original)
   - Return new recipe
```

**Response (201 Created)**:
```json
{
  "id": 1,
  "name": "Spaghetti Carbonara",
  "creatorId": 1,
  "creatorName": "Matthias",
  "canonicalId": null,
  "isDuplicate": false,
  "createdAt": "2026-05-14T10:00:00Z"
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": "Must be logged in to create recipe"
}
```

**Response (400 Bad Request)**:
```json
{
  "error": "Name is required" | "Name must be 1-100 characters" | ...
}
```

**Security**:
- User must be authenticated (token required)
- All input validated & escaped
- No SQL injection (parameterized queries)
- XSS protection: HTML in inputs escaped

---

#### GET /api/recipes/:id

**Purpose**: Get full details of a recipe

**Response (200 OK)**:
```json
{
  "id": 1,
  "name": "Spaghetti Carbonara",
  "description": "Classic Italian pasta...",
  "instructions": "1. Boil pasta... 2. Mix eggs...",
  "servings": 4,
  "creatorId": 1,
  "creatorName": "Matthias",
  "canEdit": false,
  "canDelete": false,
  "ingredients": [
    {
      "id": 1,
      "name": "Spaghetti",
      "quantity": 400,
      "unit": "g"
    }
  ],
  "createdAt": "2026-05-14T10:00:00Z",
  "updatedAt": "2026-05-14T10:00:00Z"
}
```

**Authorization**:
- `canEdit`: true only if logged-in user is creator
- `canDelete`: true only if logged-in user is creator
- Anyone can view

---

#### PUT /api/recipes/:id

**Purpose**: Update recipe (only by creator)

**Request**: Same as POST /api/recipes (all fields optional, partial update)

**Response (200 OK)**:
```json
{
  "id": 1,
  "name": "Spaghetti Carbonara (Updated)",
  ...
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": "Must be logged in"
}
```

**Response (403 Forbidden)**:
```json
{
  "error": "You can only edit recipes you created"
}
```

**Authorization**:
- User must be authenticated
- User must be the recipe creator
- No edits to canonical_id or is_duplicate flags

---

#### DELETE /api/recipes/:id

**Purpose**: Delete recipe (only by creator)

**Response (204 No Content)**: Recipe deleted

**Response (401 Unauthorized)**: Must be logged in

**Response (403 Forbidden)**: You can only delete recipes you created

**Cascade**: Deletes all ingredients linked to recipe

---

### 4.3 Ingredient Filter Endpoints

#### GET /api/recipes/ingredients

**Purpose**: Get unique list of all ingredients from community recipes

**Response (200 OK)**:
```json
{
  "ingredients": [
    "Eggs",
    "Garlic",
    "Olive Oil",
    "Spaghetti",
    "Tomato"
  ],
  "total": 127
}
```

**Query Logic**:
```sql
SELECT DISTINCT LOWER(TRIM(ingredients.name)) as name
FROM ingredients
JOIN recipes ON ingredients.recipe_id = recipes.id
WHERE recipes.canonical_id IS NULL  -- Only from original recipes
ORDER BY name ASC;
```

**Performance**:
- Indexed on ingredient names
- Returns only from canonical (original) recipes, not duplicates
- Case-insensitive distinct (LOWER function)

---

#### GET /api/recipes?ingredients=tomato,basil,garlic

**Purpose**: Filter recipes by selected ingredients (AND logic)

**Query Parameters**:
- `ingredients`: Comma-separated ingredient names (all must be present)

**Response (200 OK)**:
Same as GET /api/recipes, but filtered to only recipes containing ALL selected ingredients

**Filter Logic**:
```sql
SELECT recipes.* 
FROM recipes
WHERE recipes.canonical_id IS NULL
  AND recipes.id IN (
    SELECT recipe_id
    FROM ingredients
    WHERE LOWER(TRIM(name)) IN ('tomato', 'basil', 'garlic')
    GROUP BY recipe_id
    HAVING COUNT(DISTINCT LOWER(TRIM(name))) = 3  -- All 3 ingredients must be present
  )
ORDER BY recipes.created_at DESC
LIMIT 10 OFFSET 0;
```

---

## 5. Authentication & Security

### 5.1 JWT Token Structure

**Token Type**: JWT (JSON Web Token)

**Claims**:
```json
{
  "sub": "1",                          // user id (subject)
  "email": "user@example.com",
  "iat": 1715751600,                   // issued at
  "exp": 1715755200,                   // expires at (1h from issue)
  "type": "access"
}
```

**Storage**:
- httpOnly cookie: `sessionToken`
- Secure flag: true (HTTPS only)
- SameSite: Strict

---

### 5.2 Token Refresh Strategy (Pattern B: Sliding Window)

**Mechanism**:
1. User logs in → Server issues token with `exp = now + 1h`
2. User makes API request with token
3. Backend validates token
4. If valid → Process request + **Issue new token** (Set-Cookie header) with `exp = now + 1h`
5. If expired → Return 401, user must login again
6. If no activity for 1h → Token expires, user must login again

**Implementation**:
```javascript
// Auth middleware on every protected request
function refreshToken(oldToken) {
  const payload = jwt.verify(oldToken, SECRET);
  const newToken = jwt.sign(
    {
      sub: payload.sub,
      email: payload.email,
      type: 'access'
    },
    SECRET,
    { expiresIn: '1h' }
  );
  return newToken;
}
```

**Frontend**: Automatic (browser handles Set-Cookie)

---

### 5.3 XSS Protection

**Strategy**: Input escaping on output

**Implementation**:
- All user input (recipe names, descriptions, ingredients) escaped before rendering
- Use React's default JSX escaping (prevents HTML injection)
- Additional: sanitize with library like `xss` if HTML is allowed (future)

**Example**:
```javascript
// Backend: sanitize on save
const recipeName = sanitizeInput(req.body.name);

// Frontend: React auto-escapes
<h1>{recipe.name}</h1>  // Safe: HTML chars escaped
```

---

### 5.4 SQL Injection Protection

**Strategy**: Parameterized queries only (no string concatenation)

**Implementation**:
- Use ORM (Prisma, Sequelize) or prepared statements
- Never: `SELECT * FROM users WHERE email = '${email}'`
- Always: `SELECT * FROM users WHERE email = ?` with bound parameters

**Example**:
```javascript
// Safe: parameterized
db.prepare('SELECT * FROM users WHERE email = ?').get(email);

// Unsafe: don't do this
db.prepare(`SELECT * FROM users WHERE email = '${email}'`).get();
```

---

### 5.5 HTTPS & Transport Security

**Requirements**:
- All endpoints MUST use HTTPS in production
- JWT cookies MUST have `Secure` flag
- CORS properly configured

---

## 6. Frontend Architecture

### 6.1 State Management

**Auth State** (Context API):
```javascript
{
  user: { id, email } | null,
  isAuthenticated: boolean,
  login(email, password),
  logout(),
  register(email, password)
}
```

**Filter State** (Context API or localStorage):
```javascript
{
  selectedIngredients: string[],
  toggleIngredient(name),
  clearFilters(),
  applyFilter()
}
```

**Notes**:
- Auth state in React Context (session-based, cleared on logout)
- Filter state in Context + optional localStorage (persists during session, cleared on logout)

### 6.2 Component Structure

```
App
├─ AuthProvider
│  └─ FilterProvider
│     ├─ LoginPage
│     ├─ RegisterPage
│     └─ Dashboard
│        ├─ RecipeList
│        │  ├─ RecipeCard (with pagination)
│        │  └─ SearchBox
│        ├─ IngredientFilter
│        └─ RecipeDetail
│           ├─ IngredientList
│           └─ EditForm (if owner)
```

---

## 7. Performance Strategy

### 7.1 Database Indexes

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_recipes_creator ON recipes(creator_id);
CREATE INDEX idx_recipes_canonical ON recipes(canonical_id);
CREATE INDEX idx_recipes_name ON recipes(name);
CREATE INDEX idx_ingredients_recipe ON ingredients(recipe_id);
CREATE INDEX idx_ingredients_name ON ingredients(name);
```

**Purpose**:
- `idx_users_email`: Fast login lookups
- `idx_recipes_canonical`: Efficient deduplication checks
- `idx_recipes_name`: Fast search & sort by name
- `idx_ingredients_*`: Fast ingredient filtering

### 7.2 Query Optimization

**Goal**: <500ms for filtering, <300ms for single recipe detail

**Strategies**:
- Pagination: 10 recipes per page (not all at once)
- Eager loading: Join recipes + users + ingredient counts in one query
- Ingredient caching: GET /api/recipes/ingredients can be cached client-side during session

### 7.3 Pagination

- **Page Size**: 10 recipes per page
- **Implementation**: `OFFSET (page-1)*10 LIMIT 10`

---

## 8. Error Handling

### 8.1 HTTP Status Codes

| Code | Scenario | Example |
|------|----------|---------|
| 200 | Success | GET recipe detail |
| 201 | Created | POST new recipe |
| 204 | Deleted | DELETE recipe |
| 400 | Bad request | Invalid input |
| 401 | Unauthorized | No token / expired token |
| 403 | Forbidden | Not recipe owner |
| 404 | Not found | Recipe ID doesn't exist |
| 500 | Server error | Unexpected error |

### 8.2 Error Response Format

```json
{
  "error": "Detailed error message (during dev)",
  "code": "VALIDATION_ERROR" | "UNAUTHORIZED" | ...
}
```

**Note**: During MVP, errors are detailed. In production, generic messages recommended.

---

## 9. Testing Strategy

### 9.1 Unit Tests

- Password hashing & verification
- Email validation
- Ingredient normalization (trim, lowercase, spaces)
- Recipe deduplication logic
- Filter logic (AND operation)
- Token generation & validation

### 9.2 Integration Tests

- User registration → login → logout
- Recipe CRUD with ownership checks
- Deduplication: create identical recipes → verify only one stored
- Token refresh: concurrent requests → tokens refresh without race condition
- Ingredient filtering: select ingredients → get correct recipes
- XSS escaping: HTML in inputs → properly escaped in output
- SQL injection: special characters → no vulnerability

### 9.3 E2E Tests (Cypress)

- Complete user journey: register → create recipe → see in list → filter → view detail
- Authorization: user1 can't edit user2's recipe
- Concurrent users: user1 creates while user2 views → user2 sees new recipe
- Deduplication: user1 creates recipe → user2 creates identical → appears once

---

## 10. Deployment Considerations

### 10.1 Environment Variables

```
DATABASE_URL=postgresql://...        # Production DB
JWT_SECRET=<strong-random-secret>    # Token signing key
NODE_ENV=production                   # Environment flag
NEXTAUTH_URL=https://...              # Frontend URL (CORS)
```

### 10.2 Database Migrations

- Initial schema creation scripts
- Future: migration tools (Prisma, Knex) for schema changes

---

## 11. Known Limitations & Future Enhancements

### MVP Limitations
- No password reset (future)
- No recipe images (future)
- No user profiles beyond email (future)
- No ingredient substitutions (future)
- No nutrient-based filtering (Phase 2)

### Future Enhancements
- Ingredient aliases (oil = olive oil)
- Recipe ratings/reviews
- User profiles with bio
- Meal planning
- Shopping list generation
- Photo-based recipe recognition

---

## 12. Summary

This design provides:
✅ **Community recipe database** with deduplication  
✅ **Clear ownership** (creator can only edit/delete own recipes)  
✅ **Efficient filtering** (indexed queries, <500ms performance)  
✅ **Secure authentication** (JWT, bcrypt, httpOnly cookies)  
✅ **Scalable architecture** (ready for Raspberry Pi deployment)  

Ready for implementation planning.
