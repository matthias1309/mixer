# Code Review Checklist

## Purpose & Scope

This checklist ensures all code contributions meet the project's quality standards based on **clean code principles** (DRY, KISS, YAGNI), **SOLID design**, and **security/performance best practices**.

**When to Use**: Code reviews for pull requests, feature branches, and significant refactors.

**Success Criteria**: A contribution is approved when it passes all applicable checks and has no "blocker" issues.

---

## Quick Reference Checklist

Use this for quick reviews in PRs or discussions:

```markdown
## Code Review ✅
- [ ] Requirements met — does it fulfill the ticket/spec?
- [ ] No code duplication — reused existing utilities/components?
- [ ] Tests pass — `npm test` and `npm run test:coverage`
- [ ] No new 80%+ coverage regression (measure with `npm run test:coverage`)
- [ ] TypeScript strict mode — no `any`, `@ts-ignore`, or unsafe casts
- [ ] Input validation — user inputs checked at API boundary
- [ ] No hardcoded secrets — no API keys, passwords, tokens in code
- [ ] No breaking changes — backwards compatible or deliberately versioned?
- [ ] Clean commits — focused, well-described, no merge commits
- [ ] Linting passes — `npm run lint`
- [ ] Build succeeds — `npm run build`
```

---

## 1. Functionality & Requirements

### 1.1 Feature Completeness

- [ ] **Does the code fulfill all acceptance criteria in the ticket?**
  - Read the ticket; verify each criterion is implemented.
  - Example: "User can filter recipes by ingredient" → can you filter, does the UI show filters, does it work?

- [ ] **Are edge cases handled?**
  - Empty states (no recipes, no ingredients)
  - Invalid user input (bad IDs, malformed queries)
  - Concurrent operations (double-click, race conditions)

- [ ] **Is the feature user-facing or internal?**
  - User-facing: needs UI testing + happy path + error paths
  - Internal (API, utility): needs unit tests + integration tests

### Example ✅ vs ❌

**❌ Bad**: Implement recipe filtering by single ingredient only (incomplete).

**✅ Good**: Implement recipe filtering by multiple ingredients with AND logic, handle empty results, show "no recipes found" message.

---

## 2. Clean Code: DRY (Don't Repeat Yourself)

**Rule**: Code should appear **once and only once**.

### 2.1 Detect Duplication

- [ ] **No copy-pasted logic**
  - If you're writing the same logic twice, extract it to a shared utility/component.
  - Example duplication: validating email in 3 places → extract to `lib/validation/email.ts`

- [ ] **Component reuse**
  - Is there an existing component that could be reused instead of creating a new one?
  - Example: Use `<RecipeCard />` instead of repeating recipe display logic.

- [ ] **API response handling**
  - Fetch + error handling repeated? Extract to a custom hook or utility.
  - Example: `useAPI()` hook instead of repeating fetch/error logic in 10 components.

### 2.2 Refactor for DRY

- [ ] **Extract common code to utilities** (`lib/` directory)
  - Validation logic → `lib/validation/`
  - API helpers → `lib/api/`
  - Database queries → `lib/db/models/`

- [ ] **Extract repeated components** (`components/`)
  - Buttons with same styling → component
  - Form fields with same validation → component
  - Recipe card → reused in list, dashboard, search

### Example ✅ vs ❌

**❌ Bad**:
```typescript
// In UserProfile.tsx
const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// In AuthForm.tsx
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
```

**✅ Good**:
```typescript
// lib/validation/email.ts
export const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// lib/validation/__tests__/email.test.ts
describe('validateEmail', () => {
  it('should accept valid emails', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });
  it('should reject invalid emails', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});

// UserProfile.tsx & AuthForm.tsx both import and use
import { validateEmail } from '@/lib/validation/email';
```

---

## 3. Clean Code: KISS (Keep It Simple, Stupid)

**Rule**: Code should be as simple as possible. Avoid over-engineering.

### 3.1 Simplicity Checks

- [ ] **Understandable at first read**
  - A developer unfamiliar with this code should understand it in <2 minutes
  - No excessive nesting, no cryptic variable names

- [ ] **No premature optimization**
  - Don't optimize until it's slow (profile first)
  - Don't add caching unless you measure the bottleneck

- [ ] **No unnecessary abstraction**
  - One function per concern, not ten helper functions for one feature
  - One component per responsibility, not "BaseComponent" with 50 props

- [ ] **Clear naming**
  - Function names describe what they do: `calculateRecipeScore()`, not `calc()`
  - Variable names are specific: `userInputEmail`, not `x` or `temp`

### Example ✅ vs ❌

**❌ Bad** (over-engineered):
```typescript
interface RecipeFilterConfig {
  validators: ((recipe: Recipe) => boolean)[];
  transformers: ((recipe: Recipe) => Recipe)[];
  selectors: ((recipe: Recipe) => any)[];
  cache?: Map<string, Recipe[]>;
  cacheTimeout?: number;
}

const createFilterFactory = (config: RecipeFilterConfig) => {
  return (recipes: Recipe[]) => {
    // 50 lines of complex pipeline logic
  };
};
```

**✅ Good** (simple, direct):
```typescript
const filterRecipesByIngredients = (recipes: Recipe[], ingredients: string[]) => {
  return recipes.filter((recipe) =>
    ingredients.every((ingredient) =>
      recipe.ingredients.some((ri) => ri.name === ingredient)
    )
  );
};
```

---

## 4. Clean Code: YAGNI (You Aren't Gonna Need It)

**Rule**: Don't implement features that aren't in the spec. Don't "future-proof" for requirements that may never come.

### 4.1 YAGNI Checks

- [ ] **No "just in case" code**
  - Is this helper function actually used? If not, delete it.
  - Is this component optional field actually needed? If spec doesn't mention it, remove it.

- [ ] **No speculative abstractions**
  - Don't refactor into a plugin system because you "might add plugins later"
  - Don't add config file support for values that are never configured

- [ ] **Scope stays within ticket**
  - Feature request says "filter by ingredient" → implement that, not "filter by nutrient" too
  - Bug fix for email validation → fix that, not refactor the whole auth system

### Example ✅ vs ❌

**❌ Bad** (implements unused features):
```typescript
// DOCS-101 is "write API docs", but you also:
// - Implement GraphQL endpoint (not in spec)
// - Add API versioning headers (not in spec)
// - Create OpenAPI/Swagger generator (not in spec)
```

**✅ Good** (scope to ticket):
```typescript
// DOCS-101: Write API docs
// - Document 21 existing endpoints
// - Include curl examples
// - No new features, no new endpoints
```

---

## 5. SOLID Principles

### 5.1 Single Responsibility Principle (SRP)

- [ ] **Each function/class does one thing**
  - Function name describes its single responsibility
  - Example: `calculateRecipeScore()` calculates score; doesn't fetch recipe, doesn't update DB

- [ ] **Each file has one primary export**
  - `src/lib/db/models/recipe.ts` → RecipeModel only
  - `src/components/RecipeCard.tsx` → RecipeCard component only

### 5.2 Open/Closed Principle (OCP)

- [ ] **Code is open for extension, closed for modification**
  - Adding new phase? Extend phase system, don't modify existing phases
  - Adding new validation rule? Extend validator, don't modify existing ones

### 5.3 Liskov Substitution Principle (LSP)

- [ ] **Derived classes can substitute base classes**
  - If component extends a base, it must work in all places the base was used
  - Example: if `<Button />` is subclassed to `<IconButton />`, both must work anywhere Button works

### 5.4 Interface Segregation Principle (ISP)

- [ ] **No fat interfaces**
  - Don't require an object with 20 props when you only use 3
  - Pass only what the function needs, not the entire object

### Example ✅ vs ❌

**❌ Bad** (fat interface, poor SRP):
```typescript
// Component doing too much
const RecipeManager = ({ 
  recipe, 
  user, 
  settings, 
  cache, 
  logger 
}) => {
  // Fetches, validates, displays, caches, logs
  // 500 lines in one component
};
```

**✅ Good** (separation of concerns):
```typescript
// Single responsibility per component
const RecipeDetail = ({ recipe }: { recipe: Recipe }) => {
  // Only displays recipe
};

// Business logic separated
const useRecipeData = (recipeId: number) => {
  // Fetches and validates
};

// Cache handled separately
const recipeCache = new RecipeCache();
```

---

## 6. Test Coverage

### 6.1 Coverage Targets

- [ ] **Minimum 80% code coverage**
  - Measured: `npm run test:coverage`
  - Lines, statements, and functions >= 80%
  - Branches >= 70% (harder to test all branches)

- [ ] **All public functions/components tested**
  - If it's exported, it must have tests
  - Internal helpers can be less tested (if covered by integration tests)

- [ ] **Critical paths tested**
  - Happy path (everything works)
  - Error paths (validation fails, API fails, user cancels)
  - Edge cases (empty lists, max size, boundary values)

### 6.2 TDD Approach

- [ ] **Tests written first, then implementation**
  - Write test that fails
  - Write code to pass test
  - Refactor while tests stay green

- [ ] **Tests are integration-focused where possible**
  - Test the feature from the user perspective
  - Example: "user can filter recipes by ingredient" (not just unit-test the filter function)

### Example ✅ vs ❌

**❌ Bad** (insufficient test coverage):
```typescript
// calculateRecipeScore.ts — 200 lines, zero tests
export const calculateRecipeScore = (recipe: Recipe, phase: Phase): number => {
  // Complex scoring logic with 5 phases, 15 nutrient types
  // No tests → untested edge cases
};
```

**✅ Good** (comprehensive tests):
```typescript
// calculateRecipeScore.test.ts
describe('calculateRecipeScore', () => {
  it('should return 0-100 score', () => {
    const score = calculateRecipeScore(recipe, 'menstruation');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
  
  it('menstruation should prioritize iron', () => {
    const ironRich = { ingredients: [{ name: 'spinach', iron: 5 }] };
    const proteinRich = { ingredients: [{ name: 'chicken', protein: 30 }] };
    
    const ironScore = calculateRecipeScore(ironRich, 'menstruation');
    const proteinScore = calculateRecipeScore(proteinRich, 'menstruation');
    
    expect(ironScore).toBeGreaterThan(proteinScore);
  });
  
  // ... more tests for other phases, edge cases
});
```

---

## 7. Security

### 7.1 Authentication & Authorization

- [ ] **Protected endpoints check authentication**
  - Are endpoints that modify data protected by `sessionToken` check?
  - Are endpoints that access user data checking ownership?

- [ ] **No sensitive data in logs/errors**
  - User passwords, API keys, tokens not logged
  - Error messages don't reveal sensitive info

### 7.2 Input Validation

- [ ] **All user input is validated**
  - Check at API boundary (don't trust client validation)
  - Validate type, length, format, range
  - Use parameterized queries (SQL injection prevention)

- [ ] **XSS Prevention**
  - No `dangerouslySetInnerHTML` unless absolutely necessary
  - React's default escaping is sufficient for most cases

### 7.3 Database Security

- [ ] **Parameterized queries only**
  - `db.prepare('SELECT * FROM users WHERE id = ?').get(userId)` ✅
  - `db.exec(`SELECT * FROM users WHERE id = ${userId}`)` ❌

- [ ] **No secrets in code**
  - API keys, passwords in environment variables only
  - Example: `process.env.JWT_SECRET`, not hardcoded strings

### Example ✅ vs ❌

**❌ Bad** (security vulnerabilities):
```typescript
// SQL Injection
const user = db.exec(`SELECT * FROM users WHERE email = '${email}'`);

// XSS
return <div dangerouslySetInnerHTML={{ __html: userInput }} />;

// Secrets in code
const JWT_SECRET = 'my-secret-key-12345'; // Exposed in version control!

// Missing auth check
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // No check if user owns this recipe — any user can update any recipe!
  const recipe = updateRecipe(parseInt(params.id), request.body);
  return NextResponse.json(recipe);
}
```

**✅ Good** (secure):
```typescript
// Parameterized query
const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

// Safe rendering
const userInput = sanitizeInput(request.body.text);
return <div>{userInput}</div>; // React escapes by default

// Secrets from environment
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-for-local-dev';

// Authorization check
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { userId } = authMiddlewareWithRefresh(request); // Verify user logged in
  const recipe = getRecipe(parseInt(params.id));
  
  if (recipe.creatorId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  const updated = updateRecipe(parseInt(params.id), request.body);
  return NextResponse.json(updated);
}
```

---

## 8. Performance

### 8.1 Database Queries

- [ ] **Queries are indexed and optimized**
  - `EXPLAIN QUERY PLAN` used to verify indexes
  - No N+1 queries (fetch list, then loop to fetch each item)
  - Pagination used for large result sets

- [ ] **Query results are reasonable**
  - Response time < 500ms for typical operations
  - No unnecessary columns fetched from DB

### 8.2 Frontend Performance

- [ ] **Components memoized where appropriate**
  - `React.memo()` for components that rerender frequently
  - Hooks dependencies correct (no unnecessary rerenders)

- [ ] **Images optimized**
  - Use `<Image />` component (Next.js), not `<img />`
  - Lazy load off-screen images

### 8.3 Caching

- [ ] **Caching is only where needed**
  - Profile to find the bottleneck first
  - Don't cache static data that rarely changes
  - Do cache expensive computations

### Example ✅ vs ❌

**❌ Bad** (N+1 queries):
```typescript
// Fetch all recipes
const recipes = db.prepare('SELECT * FROM recipes').all();

// Then fetch ingredients for each recipe in a loop
const recipesWithIngredients = recipes.map(recipe => ({
  ...recipe,
  ingredients: db.prepare('SELECT * FROM ingredients WHERE recipe_id = ?').all(recipe.id)
}));
// This is N+1 queries: 1 for recipes, then N for each recipe's ingredients!
```

**✅ Good** (single efficient query):
```typescript
// Join ingredients with recipes in a single query
const recipes = db.prepare(`
  SELECT r.*, GROUP_CONCAT(i.name) as ingredient_names
  FROM recipes r
  LEFT JOIN ingredients i ON r.id = i.recipe_id
  GROUP BY r.id
`).all();
```

---

## 9. TypeScript & Type Safety

### 9.1 Type Coverage

- [ ] **No `any` types**
  - Every variable/function parameter has an explicit type
  - If you can't define the type, reconsider the design

- [ ] **No unsafe casts**
  - `as unknown as SomeType` ❌
  - Proper type assertions with type guards ✅

- [ ] **Strict mode enabled**
  - `tsconfig.json` has `"strict": true`
  - No `@ts-ignore` unless absolutely necessary (document why)

### 9.2 Interface/Type Design

- [ ] **Types match reality**
  - If a field can be undefined, mark it as `| undefined`
  - If it can be null, mark it as `| null`
  - Don't make fields optional with `?` unless they can actually be missing

### Example ✅ vs ❌

**❌ Bad** (unsafe types):
```typescript
// Using any
const data: any = request.body;
const recipeName = data.name; // No type safety

// Unsafe cast
const recipe = JSON.parse(raw) as Recipe; // Assumes it's Recipe without checking

// Type mismatch
interface Recipe {
  id: number;
  name: string; // Not optional, but code treats it as possibly undefined
}
const recipe: Recipe = { id: 1 }; // Missing name — TypeScript error!
```

**✅ Good** (safe types):
```typescript
// Proper typing
interface CreateRecipeRequest {
  name: string;
  description?: string; // Actually optional
}

const body = await request.json() as unknown;
const parsed = validateCreateRecipeRequest(body); // Runtime validation
const recipe = createRecipe(parsed); // Guaranteed valid data

// Type guards
function isRecipe(obj: unknown): obj is Recipe {
  return typeof obj === 'object' && obj !== null && 'id' in obj && 'name' in obj;
}
if (isRecipe(data)) {
  console.log(data.name); // TypeScript knows data has name
}
```

---

## 10. Documentation

### 10.1 Code Comments

- [ ] **Only document the WHY, not the WHAT**
  - ❌ `count++; // increment count`
  - ✅ `count++; // Reset after 3 retries to prevent infinite loop`

- [ ] **Comments are accurate**
  - Stale comments are worse than no comments
  - If code changes, update comments

### 10.2 API Documentation

- [ ] **Public endpoints documented**
  - Method, path, auth requirements, request/response format
  - Error status codes and error messages

- [ ] **Complex algorithms documented**
  - Recursive functions: explain the base case and recursive case
  - Non-obvious logic: explain the reasoning

### Example ✅ vs ❌

**❌ Bad** (unhelpful comments):
```typescript
// Loop through recipes
for (const recipe of recipes) {
  // Calculate score
  const score = calculateScore(recipe, phase);
  // Add to list
  results.push(score);
}
```

**✅ Good** (useful comments):
```typescript
// Sort recipes by phase-specific score (70% phase nutrients, 30% general nutrition)
// Menstruation prioritizes iron, Luteal prioritizes magnesium, etc.
const sortedByScore = recipes
  .map(recipe => ({
    recipe,
    score: calculateRecipeScore(recipe, userPhase)
  }))
  .sort((a, b) => b.score - a.score);
```

---

## 11. Commits & Git

### 11.1 Commit Quality

- [ ] **Focused commits**
  - Each commit does one thing (fix bug, add feature, refactor)
  - Not "fix bug and refactor and update docs" in one commit

- [ ] **Good commit messages**
  - First line: imperative mood, <70 chars
  - Example: `feat: add phase-based recipe scoring`
  - Not: `fixed stuff` or `update`

- [ ] **No merge commits in PRs**
  - Rebase on main before creating PR
  - Keep history clean

### Example ✅ vs ❌

**❌ Bad** (unfocused):
```
commit abc123 "fix bug and add feature and refactor utils"
  - Fixed email validation (5 files changed)
  - Added new recipe API endpoint (10 files changed)
  - Refactored database queries (20 files changed)
```

**✅ Good** (focused):
```
commit abc123 "fix: validate email format at registration"
  - lib/validation/email.ts: add validateEmail()
  - src/app/api/auth/register/route.ts: add validation check
  - src/__tests__/lib/validation/email.test.ts: add tests

commit def456 "feat: add GET /api/recipes/[id]/calculate endpoint"
  - src/app/api/recipes/[id]/calculate/route.ts: new endpoint
  - src/__tests__/integration/recipes/calculate.test.ts: tests
```

---

## 12. Frequently Asked Questions

### Q: How strict should the checklist be?

**A**: Strict, but use judgment. A typo fix doesn't need 80% test coverage. A new API endpoint absolutely does. If in doubt, ask yourself: "Would I find this bug in production?"

### Q: What's a blocker vs. a suggestion?

**Blockers** (cannot approve):
- Missing tests for new code
- Active security vulnerability
- Breaking change without documentation
- Code doesn't compile or tests don't pass

**Suggestions** (nice-to-have):
- Could extract this helper
- Variable name could be clearer
- This could be more performant
- Style preference

### Q: How long should code review take?

**A**: 15-30 min for typical PRs. If it takes >1 hour, the change is too large — ask for smaller PRs.

### Q: What if I disagree with a code review comment?

**A**: Discuss it. Code review is a conversation, not an edict. If you can justify a different approach, discuss the tradeoffs. But be open to changing your mind.

---

## Approval Checklist

Use this final checklist before approving a PR:

- [ ] All acceptance criteria met
- [ ] No regressions detected
- [ ] Tests passing (80%+ coverage)
- [ ] TypeScript strict mode, no type errors
- [ ] No duplicate code
- [ ] Security review done (auth, input validation, secrets)
- [ ] Performance acceptable (<500ms for main operations)
- [ ] Commits are focused and well-described
- [ ] Code follows project conventions
- [ ] Documentation updated (if needed)

**Result**:
- [ ] **APPROVE** — all checks pass
- [ ] **REQUEST CHANGES** — blockers found; author must address
- [ ] **COMMENT** — suggestions; optional for author to address

---

## References

- **CLAUDE.md**: Project guidelines and clean code principles
- **Arc42 Section 8.4**: Quality requirements
- **TypeScript Handbook**: Type system and strict mode
- **Next.js Docs**: Security best practices
