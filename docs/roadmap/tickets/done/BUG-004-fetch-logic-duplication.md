# BUG-004: Code Duplication in Fetch Logic (DRY Violation)

**Type**: Refactor / Bug  
**Effort**: 3 story points  
**Priority**: P2 (Should Have)  
**Status**: Done  
**Phase**: Code Quality  
**Order**: 4th  

---

## Description

Identical fetch + error handling logic is duplicated across multiple components:
- `IngredientFilter.tsx` (lines 16-35)
- `RecipeList.tsx` (lines 28-69)

This violates the DRY (Don't Repeat Yourself) principle and makes maintenance harder.

## Root Cause

No reusable custom hook for data fetching. Each component implements:
1. `setIsLoading(true)` → `fetch()` → `json()` → error handling → `setIsLoading(false)`
2. Same error message pattern: `err instanceof Error ? err.message : 'Failed to...'`

## Acceptance Criteria

- [ ] Create `src/hooks/useFetch.ts` custom hook
- [ ] Hook handles: loading state, error state, data fetching, response parsing
- [ ] IngredientFilter.tsx refactored to use `useFetch()`
- [ ] RecipeList.tsx refactored to use `useFetch()`
- [ ] Tests pass: `npm test`
- [ ] No functional regression

## Implementation Plan

1. **Create `src/hooks/useFetch.ts`**:
   ```typescript
   export function useFetch<T>(url: string, options?: RequestInit) {
     const [data, setData] = useState<T | null>(null);
     const [isLoading, setIsLoading] = useState(false);
     const [error, setError] = useState('');

     const fetch = useCallback(async () => {
       setIsLoading(true);
       setError('');
       try {
         const response = await fetch(url, { credentials: 'include', ...options });
         if (!response.ok) throw new Error('Failed to fetch');
         const result = await response.json();
         setData(result);
       } catch (err) {
         setError(err instanceof Error ? err.message : 'Request failed');
       } finally {
         setIsLoading(false);
       }
     }, [url, options]);

     return { data, isLoading, error, fetch };
   }
   ```

2. Refactor `IngredientFilter.tsx` to use the hook
3. Refactor `RecipeList.tsx` to use the hook
4. Update tests to accommodate new hook

## Testing

```bash
npm test -- IngredientFilter.test.tsx RecipeList.test.tsx
```

Should see: ✅ All tests PASS, no functional changes

## Definition of Done

- [ ] `useFetch()` hook created and typed
- [ ] Both components use the hook
- [ ] Tests pass
- [ ] No code duplication in fetch logic
- [ ] Code review approved

## Related Files

- `src/components/IngredientFilter.tsx` (lines 16-35)
- `src/components/RecipeList.tsx` (lines 28-69)
- `src/hooks/useFetch.ts` (to be created)

## CLAUDE.md Requirement

Section "Clean Code Principles" → "DRY (Don't Repeat Yourself)":
- "Code should appear **once and only once**"
- "Extract common code to utilities"
- "Fetch + error handling repeated? Extract to a custom hook"

## Notes

This is a refactoring that improves code quality without changing behavior. Lower priority than blockers (BUG-001, BUG-002, BUG-003) but important for maintainability.
