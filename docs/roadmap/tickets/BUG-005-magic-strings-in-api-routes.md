# BUG-005: Magic Strings in API Routes (Missing Constants)

**Type**: Code Quality / Bug  
**Effort**: 2 story points  
**Priority**: P2 (Should Have)  
**Status**: Ready  
**Phase**: Code Quality  
**Order**: 5th  

---

## Description

API routes use magic string literals instead of constants, making them error-prone and harder to maintain.

## Examples

**src/app/api/recipes/route.ts:13**:
```typescript
const sort = (searchParams.get('sort') || 'date') as 'date' | 'name' | 'ingredients';
```

The string literals `'date'`, `'name'`, `'ingredients'` are not defined as constants, so:
- Typos are not caught
- Changes require finding all occurrences
- Hard to maintain consistency between API, frontend, and docs

## Acceptance Criteria

- [ ] Define sort options as constants in `src/lib/constants.ts`
- [ ] Define all magic strings (sort, phase, etc.) as constants
- [ ] API routes use constants instead of magic strings
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] No functional changes

## Implementation Plan

1. **Update `src/lib/constants.ts`** to include:
   ```typescript
   export const VALID_SORT_OPTIONS = ['date', 'name', 'ingredients'] as const;
   export type SortOption = typeof VALID_SORT_OPTIONS[number];

   export const VALID_PHASES = ['menstruation', 'follicular', 'ovulation', 'luteal'] as const;
   export type Phase = typeof VALID_PHASES[number];
   ```

2. Update `src/app/api/recipes/route.ts` to use:
   ```typescript
   const sort = (searchParams.get('sort') || VALID_SORT_OPTIONS[0]) as SortOption;
   ```

3. Apply same pattern to other magic strings across API routes

4. Update tests if needed

## Testing

```bash
npm run build
npm test
```

Should see: ✅ No errors, all tests PASS

## Definition of Done

- [ ] Magic strings moved to `src/lib/constants.ts`
- [ ] API routes use named constants
- [ ] Build passes
- [ ] Tests pass
- [ ] Code review approved

## Related Files

- `src/lib/constants.ts` (update)
- `src/app/api/recipes/route.ts` (line 13, and others)
- Any other API routes with magic strings

## CLAUDE.md Requirement

Section "Clean Code: KISS":
- "Clear naming"
- "Variable names are specific"
- Avoid magic values; use named constants for intent

## Notes

This prevents bugs from typos and makes the code more maintainable. Lower priority than blockers but important for code quality.
