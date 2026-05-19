# BUG-002: Failing Ingredient Master CRUD Tests

**Type**: Bug  
**Effort**: 2 story points  
**Priority**: P1 (Blocker)  
**Status**: Done  
**Phase**: Testing  
**Order**: 2nd  

---

## Description

Two tests in the Ingredient Master CRUD endpoint fail with `SqliteError: disk I/O error`:

1. `Ingredients Master API › POST /api/ingredients-master - Create ingredient › should reject duplicate ingredient names with 409`

The error occurs during database initialization in the test setup.

## Root Cause

`SqliteError: disk I/O error` in `src/lib/db/init.ts:137` when executing migration statements. Likely:
- Database lock issue
- Incorrect test database setup
- Permission issue with test database file

## Acceptance Criteria

- [ ] Identify root cause of disk I/O error
- [ ] Fix database initialization in test setup
- [ ] All Ingredient Master tests pass: `npm test -- ingredients-master`
- [ ] No other tests broken by fix

## Testing

```bash
npm test -- ingredients-master/crud.test.ts
```

Should see: ✅ All tests PASS (currently shows 2 failures)

## Definition of Done

- [ ] Both failing tests now pass
- [ ] All other tests still pass: `npm test`
- [ ] Code review approved

## Related Files

- `src/__tests__/unit/api/ingredients-master/crud.test.ts`
- `src/lib/db/init.ts` (line 137)

## Investigation Steps

1. Check if test database is being properly isolated
2. Check if migrations are idempotent and safe to re-run
3. Verify better-sqlite3 permissions and file locking
4. Check if test cleanup is removing database locks
