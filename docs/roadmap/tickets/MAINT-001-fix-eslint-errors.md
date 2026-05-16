# MAINT-001: Fix ESLint Errors and Warnings

**Status:** Open  
**Priority:** Medium  
**Effort:** 5 pts  
**Created:** 2026-05-16  

---

## Summary

ESLint build is failing with multiple errors and warnings that prevent Docker builds. These should be fixed to maintain code quality standards.

---

## Issues Found

### Errors (Block Build)
- Duplicated `fs` imports in:
  - `src/__tests__/lib/db/models/ingredientMaster.test.ts`
  - `src/__tests__/lib/db/models/recipe-scoring.test.ts`

### Warnings (Should Fix)

**Unexpected console statements:**
- `src/app/api/recipes/ocr/[uploadId]/route.ts` (lines 10, 11, 15)
- `src/app/api/recipes/ocr/route.ts` (lines 44, 46)

**Missing useEffect dependencies:**
- `src/app/ingredients/[id]/edit/page.tsx` (line 18, missing: `fetchIngredient`)
- `src/app/ingredients/page.tsx` (line 16, missing: `fetchIngredients`)
- `src/app/recipes/[id]/edit/page.tsx` (line 27, missing: `fetchRecipe`)
- `src/app/recipes/[id]/page.tsx` (line 38, missing: `fetchRecipe`)

---

## Acceptance Criteria

- ✅ All duplicated `fs` imports are removed
- ✅ All debug console statements are removed from API routes
- ✅ All useEffect dependency arrays are corrected
- ✅ ESLint build passes without errors or warnings
- ✅ `npm run build` completes successfully

---

## Implementation Notes

**Priority:** Fix errors first (duplicated imports), then warnings.

**For console statements:** Remove debug logs from OCR routes, or add `// eslint-disable-next-line no-console` if they're necessary for production debugging.

**For useEffect dependencies:** Add missing callbacks to dependency arrays or use `useCallback` to memoize callbacks.

---

## References

- ESLint rules: https://nextjs.org/docs/app/api-reference/config/eslint
- React Hooks: https://react.dev/reference/react/useEffect
