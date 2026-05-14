# E2E User Journey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement comprehensive E2E tests for the complete user journey (register → login → create/edit/delete recipe) with error scenarios and permission validation.

**Architecture:** Modular helper-function approach with reusable Cypress utilities. All tests in a single test file organized into 4 describe blocks (Happy Path, Login Errors, Recipe Validation, Permissions). Helpers encapsulate common actions and assertions for DRY test code.

**Tech Stack:** Cypress 13.6.2, TypeScript, Cypress page objects (helper functions), existing test database

---

## File Structure

```
tests/e2e/
├── helpers/
│   └── user-journey-helpers.ts          # NEW: Reusable Cypress helpers
├── user-journey-complete.cy.ts          # NEW: Complete test suite
└── [existing test files...]
```

### `tests/e2e/helpers/user-journey-helpers.ts`
- Reusable Cypress helper functions with built-in assertions
- Functions: `registerUser()`, `loginUser()`, `createRecipe()`, `editRecipe()`, `deleteRecipe()`, `logoutUser()`, `verifyNoAccess()`
- Encapsulates UI navigation, form filling, and result assertions
- Exported for use in test files

### `tests/e2e/user-journey-complete.cy.ts`
- Single test file with 4 describe blocks (one per scenario category)
- Suite 1: Happy Path (1 test)
- Suite 2: Login Errors (2 tests)
- Suite 3: Recipe Validation (3 tests)
- Suite 4: Permission Errors (2 tests)

---

## Implementation Tasks

### Task 1: Set up helper file structure

**Files:**
- Create: `tests/e2e/helpers/user-journey-helpers.ts`

- [ ] **Step 1: Create helper file with TypeScript interface**

Create `tests/e2e/helpers/user-journey-helpers.ts`:

```typescript
// Type definition for recipe data
interface RecipeData {
  name: string;
  description: string;
  instructions: string;
  servings: number;
  ingredients: Array<{ name: string; quantity: number }>;
}

// Helper functions will be added in following tasks
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/helpers/user-journey-helpers.ts
git commit -m "test: create E2E helper file with RecipeData interface"
```

---

### Task 2: Implement registerUser helper function

**Files:**
- Modify: `tests/e2e/helpers/user-journey-helpers.ts`

- [ ] **Step 1: Add registerUser function**

Add to `tests/e2e/helpers/user-journey-helpers.ts`:

```typescript
/**
 * Register a new user and verify successful registration (redirect to dashboard)
 */
export const registerUser = (email: string, password: string): void => {
  cy.visit('http://localhost:3000/register');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').first().type(password);
  cy.get('input[type="password"]').last().type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
};
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/helpers/user-journey-helpers.ts
git commit -m "test: add registerUser helper function"
```

---

### Task 3: Implement loginUser helper function

**Files:**
- Modify: `tests/e2e/helpers/user-journey-helpers.ts`

- [ ] **Step 1: Add loginUser function with error handling**

Add to `tests/e2e/helpers/user-journey-helpers.ts`:

```typescript
/**
 * Login a user and verify result
 * @param shouldFail - If true, expects error message instead of dashboard redirect
 */
export const loginUser = (email: string, password: string, shouldFail = false): void => {
  cy.visit('http://localhost:3000/login');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  
  if (shouldFail) {
    cy.contains('Invalid email or password').should('be.visible');
  } else {
    cy.url().should('include', '/dashboard');
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/helpers/user-journey-helpers.ts
git commit -m "test: add loginUser helper function with error handling"
```

---

### Task 4: Implement createRecipe helper function

**Files:**
- Modify: `tests/e2e/helpers/user-journey-helpers.ts`

- [ ] **Step 1: Add createRecipe function**

Add to `tests/e2e/helpers/user-journey-helpers.ts`:

```typescript
/**
 * Create a new recipe and verify successful creation
 * Extracts and returns the recipe ID from the URL
 */
export const createRecipe = (data: RecipeData): number => {
  cy.contains('Create Recipe').click();
  cy.url().should('include', '/recipes/new');
  
  // Fill recipe form
  cy.get('input').first().type(data.name);
  cy.get('textarea').first().type(data.description);
  cy.get('textarea').eq(1).type(data.instructions);
  cy.get('input[type="number"]').first().clear().type(data.servings.toString());
  
  // Add ingredients
  data.ingredients.forEach((ingredient) => {
    cy.contains('Add Ingredient').click();
    cy.get('input[placeholder="Ingredient name"]').last().type(ingredient.name);
    cy.get('input[placeholder="Qty"]').last().type(ingredient.quantity.toString());
  });
  
  // Submit form
  cy.contains('Create Recipe').click();
  
  // Verify on recipe detail page and extract recipe ID
  cy.url().should('match', /\/recipes\/\d+$/);
  cy.contains(data.name).should('be.visible');
  
  // Extract recipe ID from URL
  let recipeId = 0;
  cy.url().then((url) => {
    const match = url.match(/\/recipes\/(\d+)$/);
    if (match) {
      recipeId = parseInt(match[1], 10);
    }
  });
  
  return recipeId;
};
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/helpers/user-journey-helpers.ts
git commit -m "test: add createRecipe helper function"
```

---

### Task 5: Implement editRecipe helper function

**Files:**
- Modify: `tests/e2e/helpers/user-journey-helpers.ts`

- [ ] **Step 1: Add editRecipe function**

Add to `tests/e2e/helpers/user-journey-helpers.ts`:

```typescript
/**
 * Edit an existing recipe with partial data and verify changes
 */
export const editRecipe = (recipeId: number, newData: Partial<RecipeData>): void => {
  cy.visit(`http://localhost:3000/recipes/${recipeId}/edit`);
  cy.url().should('include', `/recipes/${recipeId}/edit`);
  
  // Update name if provided
  if (newData.name) {
    cy.get('input').first().clear().type(newData.name);
  }
  
  // Update description if provided
  if (newData.description) {
    cy.get('textarea').first().clear().type(newData.description);
  }
  
  // Update instructions if provided
  if (newData.instructions) {
    cy.get('textarea').eq(1).clear().type(newData.instructions);
  }
  
  // Update servings if provided
  if (newData.servings) {
    cy.get('input[type="number"]').first().clear().type(newData.servings.toString());
  }
  
  // Submit form
  cy.contains('Update Recipe').click();
  
  // Verify on recipe detail page and changes are visible
  cy.url().should('include', `/recipes/${recipeId}`);
  if (newData.name) {
    cy.contains(newData.name).should('be.visible');
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/helpers/user-journey-helpers.ts
git commit -m "test: add editRecipe helper function"
```

---

### Task 6: Implement deleteRecipe and logoutUser helper functions

**Files:**
- Modify: `tests/e2e/helpers/user-journey-helpers.ts`

- [ ] **Step 1: Add deleteRecipe and logoutUser functions**

Add to `tests/e2e/helpers/user-journey-helpers.ts`:

```typescript
/**
 * Delete a recipe and verify it's gone
 */
export const deleteRecipe = (recipeId: number): void => {
  cy.visit(`http://localhost:3000/recipes/${recipeId}`);
  cy.contains('Delete Recipe').click();
  
  // Handle confirmation if present
  cy.on('window:confirm', () => true);
  
  // Verify redirect to dashboard
  cy.url().should('include', '/dashboard');
};

/**
 * Logout the current user and verify redirect to login
 */
export const logoutUser = (): void => {
  cy.contains('Logout').click();
  cy.url().should('include', '/login');
};

/**
 * Verify that a user cannot access a recipe's edit page
 */
export const verifyNoAccess = (recipeId: number): void => {
  cy.visit(`http://localhost:3000/recipes/${recipeId}/edit`);
  // Verify error message or redirect
  cy.contains(/permission|access|unauthorized/i).should('be.visible');
};
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/helpers/user-journey-helpers.ts
git commit -m "test: add deleteRecipe, logoutUser, and verifyNoAccess helpers"
```

---

### Task 7: Create test file with Happy Path test

**Files:**
- Create: `tests/e2e/user-journey-complete.cy.ts`
- Test: Suite 1 (Happy Path)

- [ ] **Step 1: Create test file with Happy Path describe block**

Create `tests/e2e/user-journey-complete.cy.ts`:

```typescript
import * as journeyHelpers from './helpers/user-journey-helpers';

describe('User Journey - Happy Path', () => {
  it('should complete full user journey: register → login → create → edit → delete', () => {
    // Generate unique email for this test
    const testEmail = `user-happy-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123';
    
    // Register
    journeyHelpers.registerUser(testEmail, testPassword);
    
    // Create recipe
    const recipeData = {
      name: 'Test Recipe',
      description: 'A test recipe',
      instructions: '1. Mix\n2. Cook\n3. Serve',
      servings: 2,
      ingredients: [{ name: 'Tomato', quantity: 2 }],
    };
    
    journeyHelpers.createRecipe(recipeData);
    
    // Get recipe ID from URL
    let recipeId = 0;
    cy.url().then((url) => {
      const match = url.match(/\/recipes\/(\d+)$/);
      if (match) {
        recipeId = parseInt(match[1], 10);
      }
    });
    
    // Edit recipe
    cy.then(() => {
      journeyHelpers.editRecipe(recipeId, { name: 'Updated Test Recipe', servings: 4 });
    });
    
    // Verify updated name is visible
    cy.contains('Updated Test Recipe').should('be.visible');
    
    // Delete recipe
    cy.then(() => {
      journeyHelpers.deleteRecipe(recipeId);
    });
    
    // Verify back on dashboard (recipe is gone)
    cy.url().should('include', '/dashboard');
  });
});
```

- [ ] **Step 2: Run test to verify it works**

```bash
npm run test:e2e:headless -- --spec "tests/e2e/user-journey-complete.cy.ts"
```

Expected: Test passes (or runs without crashing)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/user-journey-complete.cy.ts tests/e2e/helpers/user-journey-helpers.ts
git commit -m "test: add Happy Path E2E test with helper integration"
```

---

### Task 8: Add Login Error tests

**Files:**
- Modify: `tests/e2e/user-journey-complete.cy.ts`

- [ ] **Step 1: Add Login Errors describe block**

Add to `tests/e2e/user-journey-complete.cy.ts`:

```typescript
describe('User Journey - Login Errors', () => {
  beforeEach(() => {
    // Create a test user for login tests
    const testEmail = `user-login-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123';
    journeyHelpers.registerUser(testEmail, testPassword);
    journeyHelpers.logoutUser();
    
    // Store for use in tests
    cy.wrap(testEmail).as('testEmail');
    cy.wrap(testPassword).as('testPassword');
  });

  it('should show error for wrong password', function () {
    journeyHelpers.loginUser(this.testEmail, 'WrongPassword123', true);
  });

  it('should show error for non-existent user', () => {
    journeyHelpers.loginUser('nonexistent@example.com', 'SomePassword123', true);
  });
});
```

- [ ] **Step 2: Run tests to verify they work**

```bash
npm run test:e2e:headless -- --spec "tests/e2e/user-journey-complete.cy.ts"
```

Expected: All 3 tests pass (1 Happy Path + 2 Login Error tests)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/user-journey-complete.cy.ts
git commit -m "test: add Login Error E2E tests"
```

---

### Task 9: Add Recipe Validation tests

**Files:**
- Modify: `tests/e2e/user-journey-complete.cy.ts`

- [ ] **Step 1: Add Recipe Validation describe block**

Add to `tests/e2e/user-journey-complete.cy.ts`:

```typescript
describe('User Journey - Recipe Validation', () => {
  beforeEach(() => {
    const testEmail = `user-validation-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123';
    journeyHelpers.registerUser(testEmail, testPassword);
  });

  it('should show error for empty recipe name', () => {
    cy.contains('Create Recipe').click();
    cy.url().should('include', '/recipes/new');
    
    // Leave name empty, fill other fields
    cy.get('textarea').first().type('A test recipe');
    cy.get('textarea').eq(1).type('1. Mix\n2. Cook\n3. Serve');
    cy.get('input[type="number"]').first().clear().type('2');
    cy.contains('Add Ingredient').click();
    cy.get('input[placeholder="Ingredient name"]').type('Tomato');
    cy.get('input[placeholder="Qty"]').type('2');
    
    // Try to submit without name
    cy.contains('Create Recipe').click();
    cy.contains(/name|required/i).should('be.visible');
  });

  it('should show error for invalid servings', () => {
    cy.contains('Create Recipe').click();
    cy.url().should('include', '/recipes/new');
    
    // Fill form but set invalid servings
    cy.get('input').first().type('Test Recipe');
    cy.get('textarea').first().type('A test recipe');
    cy.get('textarea').eq(1).type('1. Mix\n2. Cook\n3. Serve');
    cy.get('input[type="number"]').first().clear().type('0');
    cy.contains('Add Ingredient').click();
    cy.get('input[placeholder="Ingredient name"]').type('Tomato');
    cy.get('input[placeholder="Qty"]').type('2');
    
    // Try to submit with invalid servings
    cy.contains('Create Recipe').click();
    cy.contains(/servings|greater|valid/i).should('be.visible');
  });

  it('should show error for recipe without ingredients', () => {
    cy.contains('Create Recipe').click();
    cy.url().should('include', '/recipes/new');
    
    // Fill form but don't add ingredients
    cy.get('input').first().type('Test Recipe');
    cy.get('textarea').first().type('A test recipe');
    cy.get('textarea').eq(1).type('1. Mix\n2. Cook\n3. Serve');
    cy.get('input[type="number"]').first().clear().type('2');
    
    // Try to submit without ingredients
    cy.contains('Create Recipe').click();
    cy.contains(/ingredient|require/i).should('be.visible');
  });
});
```

- [ ] **Step 2: Run tests to verify they work**

```bash
npm run test:e2e:headless -- --spec "tests/e2e/user-journey-complete.cy.ts"
```

Expected: All 6 tests pass (1 Happy + 2 Login + 3 Validation)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/user-journey-complete.cy.ts
git commit -m "test: add Recipe Validation E2E tests"
```

---

### Task 10: Add Permission Error tests

**Files:**
- Modify: `tests/e2e/user-journey-complete.cy.ts`
- Modify: `tests/e2e/helpers/user-journey-helpers.ts` (if needed)

- [ ] **Step 1: Add Permission Errors describe block**

Add to `tests/e2e/user-journey-complete.cy.ts`:

```typescript
describe('User Journey - Permissions', () => {
  it('User2 cannot edit User1\'s recipe', () => {
    // USER 1: Register and create recipe
    const user1Email = `user1-${Date.now()}@example.com`;
    const user1Password = 'SecurePassword123';
    journeyHelpers.registerUser(user1Email, user1Password);
    
    const recipeData = {
      name: 'User1 Recipe',
      description: 'A recipe by user 1',
      instructions: '1. Mix\n2. Cook',
      servings: 2,
      ingredients: [{ name: 'Tomato', quantity: 2 }],
    };
    
    journeyHelpers.createRecipe(recipeData);
    
    // Get recipe ID
    let recipeId = 0;
    cy.url().then((url) => {
      const match = url.match(/\/recipes\/(\d+)$/);
      if (match) {
        recipeId = parseInt(match[1], 10);
      }
    });
    
    // USER 1: Logout
    cy.then(() => {
      journeyHelpers.logoutUser();
    });
    
    // USER 2: Register with different email
    const user2Email = `user2-${Date.now()}@example.com`;
    const user2Password = 'SecurePassword123';
    journeyHelpers.registerUser(user2Email, user2Password);
    
    // USER 2: Try to access User1's recipe edit page
    cy.then(() => {
      journeyHelpers.verifyNoAccess(recipeId);
    });
  });

  it('User2 cannot delete User1\'s recipe', () => {
    // USER 1: Register and create recipe
    const user1Email = `user1-delete-${Date.now()}@example.com`;
    const user1Password = 'SecurePassword123';
    journeyHelpers.registerUser(user1Email, user1Password);
    
    const recipeData = {
      name: 'User1 Recipe Delete Test',
      description: 'A recipe by user 1',
      instructions: '1. Mix\n2. Cook',
      servings: 2,
      ingredients: [{ name: 'Tomato', quantity: 2 }],
    };
    
    journeyHelpers.createRecipe(recipeData);
    
    // Get recipe ID
    let recipeId = 0;
    cy.url().then((url) => {
      const match = url.match(/\/recipes\/(\d+)$/);
      if (match) {
        recipeId = parseInt(match[1], 10);
      }
    });
    
    // USER 1: Logout
    cy.then(() => {
      journeyHelpers.logoutUser();
    });
    
    // USER 2: Register with different email
    const user2Email = `user2-delete-${Date.now()}@example.com`;
    const user2Password = 'SecurePassword123';
    journeyHelpers.registerUser(user2Email, user2Password);
    
    // USER 2: Try to access User1's recipe detail and verify no delete button
    cy.then(() => {
      cy.visit(`http://localhost:3000/recipes/${recipeId}`);
      cy.contains('Delete Recipe').should('not.exist');
    });
  });
});
```

- [ ] **Step 2: Run all tests to verify complete suite**

```bash
npm run test:e2e:headless -- --spec "tests/e2e/user-journey-complete.cy.ts"
```

Expected: All 8 tests pass (1 Happy + 2 Login + 3 Validation + 2 Permission)

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/user-journey-complete.cy.ts tests/e2e/helpers/user-journey-helpers.ts
git commit -m "test: add Permission Error E2E tests - complete user journey suite"
```

---

### Task 11: Final verification and cleanup

**Files:**
- `tests/e2e/user-journey-complete.cy.ts`
- `tests/e2e/helpers/user-journey-helpers.ts`

- [ ] **Step 1: Run full test suite in interactive mode**

```bash
npm run test:e2e
```

Select `user-journey-complete.cy.ts` and run all tests. Verify all 8 tests pass.

- [ ] **Step 2: Run full test suite in headless mode**

```bash
npm run test:e2e:headless -- --spec "tests/e2e/user-journey-complete.cy.ts"
```

Expected: All 8 tests pass, execution completes in under 1 minute

- [ ] **Step 3: Verify existing tests still pass**

```bash
npm run test:e2e:headless
```

Expected: All existing E2E tests still pass (should not break anything)

- [ ] **Step 4: Final commit with summary**

```bash
git add tests/e2e/
git commit -m "test(e2e): comprehensive user journey tests with helpers

- Add modular helper functions for registration, login, recipe CRUD
- Happy Path: complete user journey (register → create → edit → delete)
- Login errors: wrong password and non-existent user
- Recipe validation: empty name, invalid servings, missing ingredients
- Permission errors: User2 cannot modify User1's recipes

All 8 E2E tests passing, DRY helper pattern for future tests"
```

---

## Verification Checklist

Before considering complete:

- [ ] All 8 tests pass in interactive and headless mode
- [ ] No errors in Cypress runner
- [ ] Helper functions are reusable and follow DRY principle
- [ ] Test data is dynamically generated (no hardcoded emails)
- [ ] Each test is independent and can run in any order
- [ ] Error messages are verified with exact text or patterns
- [ ] Recipe ID extraction works correctly
- [ ] Permission checks prevent unauthorized access
