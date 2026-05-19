# BUG-002: Read-only Database Error in ingredients.test.ts

## Status
🔴 Open

## Description
Two tests in `src/__tests__/unit/api/recipes/ingredients.test.ts` are failing with "attempt to write a readonly database" errors:

1. `GET /api/recipes/ingredients › should get unique ingredients from all recipes`
2. `GET /api/recipes/ingredients › should return normalized (lowercase, trimmed) ingredient names`

## Error Details
```
SqliteError: attempt to write a readonly database
  at RecipeModel.run [as create] (src/lib/db/models/recipe.ts:45:24)
  at Object.create (src/__tests__/unit/api/recipes/ingredients.test.ts:93:17)
```

and

```
SqliteError: attempt to write a readonly database
  at UserModel.run [as create] (src/lib/db/models/user.ts:23:25)
  at Object.create (src/__tests__/unit/api/recipes/ingredients.test.ts:43:34)
```

## Root Cause
The test database becomes read-only during test execution, preventing INSERT operations. Likely causes:
- Database file permission issues
- Database lock not being released properly
- Test setup not properly initializing test database

## Steps to Reproduce
```bash
npm test -- src/__tests__/unit/api/recipes/ingredients.test.ts
```

## Expected Behavior
Both tests should pass without database write errors.

## Actual Behavior
Tests fail with "attempt to write a readonly database" error during recipe/user creation.

## Impact
- 2 failing tests (out of 316 total)
- Affects ingredient list API validation
- Prevents complete test suite success

## Notes
- Issue is isolated to `ingredients.test.ts` only
- Other test suites (crud.test.ts with 31 tests) pass successfully
- Issue appears to be a database initialization or permission problem in this specific test file
- Not related to recent quantity validation changes

## Acceptance Criteria
- [ ] Both tests pass without errors
- [ ] Database writes succeed in test environment
- [ ] Test cleanup properly releases database locks
- [ ] Full test suite passes (316/316)
