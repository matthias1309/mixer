# BUG-006: Test Coverage Below 80% Target (Definition of Done)

**Type**: Bug / Quality Gate  
**Effort**: 3 story points  
**Priority**: P1 (Blocker)  
**Status**: Ready  
**Phase**: Testing  
**Order**: 6th  

---

## Description

CLAUDE.md specifies minimum 80% code coverage as a Definition of Done requirement:

> "Minimum 80% code coverage"  
> "Tests passing and passing (80%+ coverage)"

Current coverage status is **unclear** because:
1. 2 tests fail (BUG-002), blocking coverage report generation
2. Coverage report exists but percentage not visible in CI output
3. No CI check enforces the 80% threshold

## Root Cause

1. Test failures in `ingredients-master/crud.test.ts` prevent full coverage report
2. Jest coverage configuration may not be strict enough
3. No automated check to prevent merging below-threshold code

## Acceptance Criteria

- [ ] Fix failing tests (BUG-002) to generate complete coverage report
- [ ] Measure actual coverage: `npm run test:coverage`
- [ ] Identify any modules below 80% coverage
- [ ] Increase coverage to 80%+ for all modules
- [ ] Configure Jest to fail build if coverage < 80%
- [ ] Add CI check to enforce coverage gate

## Implementation Plan

1. **First**: Fix BUG-002 (failing tests) to enable coverage measurement
2. **Run coverage report**:
   ```bash
   npm run test:coverage
   ```
3. **Identify gaps** in coverage report
4. **Add tests** to reach 80% threshold
5. **Update jest.config.js** to add coverage thresholds:
   ```javascript
   coverageThreshold: {
     global: {
       statements: 80,
       branches: 70,
       functions: 80,
       lines: 80,
     },
   }
   ```
6. **Verify**: `npm run test:coverage` should show ✅ PASS

## Testing

```bash
npm run test:coverage
```

Output should show:
```
✅ Global Coverage:  ≥ 80% statements, branches, functions, lines
```

## Definition of Done

- [ ] All tests passing (BUG-002 fixed)
- [ ] Coverage report generated successfully
- [ ] Coverage ≥ 80% for all modules
- [ ] Jest config enforces 80% threshold
- [ ] Build fails if coverage < 80%
- [ ] Code review approved

## Related Files

- `jest.config.js` (add coverage thresholds)
- `src/__tests__/**/*.test.ts` (add missing tests as needed)
- `package.json` (test script configuration)

## CLAUDE.md Requirement

Section "Definition of Done":
- "Tests written and passing (80%+ coverage)"

Section "Test Coverage":
- "Minimum 80% code coverage"
- "Measured: `npm run test:coverage`"

## Dependencies

- **Depends on**: BUG-002 (Failing Ingredient Master Tests)
- **Blocks**: Merge of any feature PR

## Notes

This is a quality gate. Cannot approve PRs until coverage reaches 80%. The 2 failing tests (BUG-002) must be fixed first to get an accurate coverage report.
