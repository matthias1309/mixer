# E2E User Journey Test Design

**Date**: 2026-05-14  
**Status**: Design Phase  
**Scope**: Comprehensive E2E tests for complete user journey with error scenarios  

## Overview

This document defines the comprehensive E2E test suite for the recipe manager application. The tests cover a complete user journey (registration → login → recipe CRUD) with error scenarios and permission validation using two test users.

## Goals

1. **Test Happy Path**: Verify the complete user journey works end-to-end
2. **Test Error Handling**: Validate error messages and behavior for common failures
3. **Test Authorization**: Ensure users can only access/modify their own recipes
4. **Maintainability**: Create reusable helper functions to keep tests DRY and maintainable

## Architecture

### File Structure

```
tests/e2e/
├── helpers/
│   └── user-journey-helpers.ts     # Reusable helper functions
├── user-journey-complete.cy.ts     # Complete test suite (all scenarios)
└── [existing test files...]
```

### Helper Functions (`user-journey-helpers.ts`)

Reusable Cypress helper functions that encapsulate common actions and include assertions:

#### `registerUser(email: string, password: string): void`
- Navigates to `/register`
- Fills in email and password fields
- Confirms password matches
- Submits registration form
- **Assertion**: Verifies redirect to `/dashboard`

#### `loginUser(email: string, password: string, shouldFail?: boolean): void`
- Navigates to `/login`
- Fills in email and password
- Submits login form
- **Assertions**:
  - If `shouldFail=false`: Verifies redirect to `/dashboard`
  - If `shouldFail=true`: Verifies error message "Invalid email or password" is visible

#### `createRecipe(data: RecipeData): number`
- Clicks "Create Recipe" button
- Fills recipe form (name, description, instructions, servings)
- Adds ingredients
- Submits form
- **Assertion**: Verifies redirect to recipe detail page (`/recipes/{id}`)
- **Returns**: Extracted recipe ID from URL for later use

**RecipeData interface:**
```typescript
interface RecipeData {
  name: string;
  description: string;
  instructions: string;
  servings: number;
  ingredients: Array<{name: string; quantity: number}>;
}
```

#### `editRecipe(recipeId: number, newData: Partial<RecipeData>): void`
- Navigates to `/recipes/{recipeId}/edit`
- Updates provided fields
- Submits form
- **Assertion**: Verifies recipe detail page shows updated data

#### `deleteRecipe(recipeId: number): void`
- Navigates to recipe detail page
- Clicks delete button
- Confirms deletion if prompted
- **Assertion**: Verifies redirect to `/dashboard`

#### `logoutUser(): void`
- Clicks logout button
- **Assertion**: Verifies redirect to login page

#### `verifyNoAccess(recipeId: number): void`
- Attempts to navigate to `/recipes/{recipeId}/edit`
- **Assertion**: Verifies user cannot access (error message or 403)

---

## Test Suites

### Suite 1: Happy Path User Journey
**File**: `user-journey-complete.cy.ts` - `describe('User Journey - Happy Path')`

**Test**: "Should complete full user journey: register → login → create → edit → delete"

**Steps**:
1. Generate unique email: `user1-${Date.now()}@example.com`
2. Register with email and password "SecurePassword123"
3. Verify logged in (on dashboard)
4. Create recipe:
   - Name: "Test Recipe"
   - Description: "A test recipe"
   - Instructions: "1. Mix\n2. Cook\n3. Serve"
   - Servings: 2
   - Ingredient: "Tomato" × 2
5. Verify recipe detail page shows "Test Recipe"
6. Edit recipe:
   - Change name to "Updated Test Recipe"
   - Change servings to 4
7. Verify changes saved
8. Delete recipe
9. Verify back on dashboard and recipe is gone

**Expected Result**: All steps succeed, no errors

---

### Suite 2: Login Error Scenarios
**File**: `user-journey-complete.cy.ts` - `describe('User Journey - Login Errors')`

**Test 2a**: "Should show error for wrong password"
- Register user with email and password
- Attempt login with same email but wrong password
- **Assertion**: Error message "Invalid email or password" visible

**Test 2b**: "Should show error for non-existent user"
- Attempt login with non-existent email
- **Assertion**: Error message "Invalid email or password" visible

---

### Suite 3: Recipe Validation Errors
**File**: `user-journey-complete.cy.ts` - `describe('User Journey - Recipe Validation')`

**Test 3a**: "Should show error for empty recipe name"
- User registers and logs in
- Navigate to create recipe
- Leave name empty, fill other fields
- Submit form
- **Assertion**: Error message about required name field

**Test 3b**: "Should show error for invalid servings (negative/zero)"
- User registers and logs in
- Navigate to create recipe
- Fill all fields but set servings to 0 or negative
- Submit form
- **Assertion**: Error message about invalid servings

**Test 3c**: "Should show error for recipe without ingredients"
- User registers and logs in
- Navigate to create recipe
- Fill all fields but don't add any ingredients
- Submit form
- **Assertion**: Error message about needing at least one ingredient

---

### Suite 4: Permission/Authorization Errors
**File**: `user-journey-complete.cy.ts` - `describe('User Journey - Permissions')`

Uses two test users to verify authorization.

**Test 4a**: "User2 cannot edit User1's recipe"
- **Setup**:
  - User 1: Register, login, create recipe (save recipe ID)
  - User 1: Logout
  - User 2: Register with different email, login
- **Action**: User 2 navigates to User1's recipe edit page
- **Assertion**: User 2 cannot access edit page (error message or forbidden response)

**Test 4b**: "User2 cannot delete User1's recipe"
- **Setup**: Same as Test 4a
- **Action**: User 2 attempts to delete User1's recipe (via API or UI)
- **Assertion**: Delete fails with permission error

---

## Data Strategy

### Test User Generation
- Dynamic emails to prevent conflicts: `user-${Date.now()}@example.com`
- Standard test password: `SecurePassword123`
- Each test generates unique data to allow parallel execution

### Test Data Cleanup
- Tests should not depend on cleanup (can run independently)
- Each test creates its own user/recipe data
- No shared state between tests

---

## Error Handling Strategy

### Explicit Assertions
Every action includes a verification:
- After registration → verify dashboard
- After login → verify dashboard or error message
- After recipe creation → verify detail page or error message
- After edit → verify updated data
- After delete → verify gone from list

### Error Message Validation
Tests verify exact error messages, not just that an error occurred:
- "Invalid email or password"
- "Email and password are required"
- "Recipe name is required"
- "Servings must be greater than 0"
- "At least one ingredient is required"

### Permission Error Messages
Tests verify authorization errors:
- "You don't have permission to edit this recipe"
- Or appropriate HTTP 403 response

---

## Browser and Environment

- **Browser**: Cypress default (Electron for headless, Chrome/Firefox for interactive)
- **Base URL**: `http://localhost:3000`
- **Database**: Must be running (local SQLite or Docker PostgreSQL)
- **Server**: Must be running (`npm run dev`)

---

## Execution Strategy

**Interactive mode** (development):
```bash
npm run test:e2e
# Opens Cypress Test Runner, select user-journey-complete.cy.ts
```

**Headless mode** (CI/automation):
```bash
npm run test:e2e:headless -- --spec "tests/e2e/user-journey-complete.cy.ts"
```

**Expected Duration**: ~30-45 seconds for complete suite (4 describe blocks × ~3-4 tests each)

---

## Future Enhancements

1. **Recipe Search/Filtering**: Add tests for ingredient-based filtering
2. **Recipe Sharing**: Test sharing recipes between users (future feature)
3. **Performance**: Add tests for slow network conditions
4. **Accessibility**: Add tests for keyboard navigation and screen readers

---

## Success Criteria

✅ All tests pass consistently  
✅ Tests are independent (can run in any order)  
✅ Helper functions are reusable and DRY  
✅ Clear error messages when tests fail  
✅ Tests run in under 1 minute total  
✅ No hardcoded data dependencies
