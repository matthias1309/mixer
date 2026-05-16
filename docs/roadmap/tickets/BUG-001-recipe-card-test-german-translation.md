# BUG-001: RecipeCard Test German Translation Mismatch

**Type**: Bug  
**Effort**: 1 story point  
**Priority**: P1 (Blocker)  
**Status**: Ready  
**Phase**: Testing  
**Order**: 1st  

---

## Description

The RecipeCard component was translated to German (displays "von {creatorName}"), but the test still expects English text ("by Test User"). This causes the test to fail.

## Root Cause

Component uses German translation: `von {props.creatorName}` (line 35)  
Test expects English: `expect(screen.getByText('by Test User'))` (line 18)

## Acceptance Criteria

- [ ] RecipeCard.test.tsx updated to match German translation
- [ ] Test passes: `npm test -- RecipeCard.test.tsx`
- [ ] All RecipeCard tests green

## Testing

```bash
npm test -- RecipeCard.test.tsx
```

Should see: ✅ PASS

## Definition of Done

- [ ] Test passes
- [ ] No other tests broken
- [ ] Code review approved

## Related Files

- `src/components/RecipeCard.tsx` (line 35)
- `src/__tests__/components/RecipeCard.test.tsx` (line 18)

## Notes

- German translation is correct — fix the test, not the component
- This is a prerequisite for Definition of Done ("Tests passing")
