# BUG-007: Pagination Logic Not Extracted (KISS/YAGNI Violation)

**Type**: Refactor / Code Quality  
**Effort**: 2 story points  
**Priority**: P3 (Nice to Have)  
**Status**: Ready  
**Phase**: Code Quality  
**Order**: 7th  

---

## Description

Pagination controls are hardcoded in `RecipeList.tsx` (lines 110-131), but this logic could be reused in other list views. Extracting to a `<Pagination />` component follows the KISS (Keep It Simple) principle of reusable components.

## Current Problem

**RecipeList.tsx (lines 110-131)**:
```typescript
{totalPages > 1 && (
  <div className="flex justify-center gap-2">
    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="...">
      Vorherige
    </button>
    <span className="px-4 py-2 text-gray-600">
      Seite {page} von {totalPages}
    </span>
    <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="...">
      Nächste
    </button>
  </div>
)}
```

This is hardcoded HTML + logic that will be needed in other list views.

## Acceptance Criteria

- [ ] Create `src/components/Pagination.tsx` component
- [ ] Component accepts: `page`, `totalPages`, `onPageChange` props
- [ ] RecipeList.tsx refactored to use `<Pagination />`
- [ ] Tests still pass: `npm test`
- [ ] No functional regression
- [ ] Component is reusable for future list views

## Implementation Plan

1. **Create `src/components/Pagination.tsx`**:
   ```typescript
   interface PaginationProps {
     page: number;
     totalPages: number;
     onPageChange: (newPage: number) => void;
   }

   export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
     if (totalPages <= 1) return null;

     return (
       <div className="flex justify-center gap-2">
         <button
           onClick={() => onPageChange(Math.max(1, page - 1))}
           disabled={page === 1}
           className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
         >
           Vorherige
         </button>
         <span className="px-4 py-2 text-gray-600">
           Seite {page} von {totalPages}
         </span>
         <button
           onClick={() => onPageChange(Math.min(totalPages, page + 1))}
           disabled={page === totalPages}
           className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
         >
           Nächste
         </button>
       </div>
     );
   }
   ```

2. Update `RecipeList.tsx` to use:
   ```typescript
   <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
   ```

3. Add tests: `src/__tests__/components/Pagination.test.tsx`

## Testing

```bash
npm test -- Pagination.test.tsx RecipeList.test.tsx
```

Should see: ✅ All tests PASS, no functional changes

## Definition of Done

- [ ] `Pagination.tsx` component created
- [ ] RecipeList uses the component
- [ ] Pagination tests written
- [ ] All tests pass
- [ ] No functional regression
- [ ] Code review approved

## Related Files

- `src/components/Pagination.tsx` (to be created)
- `src/components/RecipeList.tsx` (refactor lines 110-131)
- `src/__tests__/components/Pagination.test.tsx` (to be created)

## CLAUDE.md Requirement

Section "Clean Code: KISS":
- "Keep It Simple, Stupid"
- "No unnecessary abstraction" — but this **is** necessary because pagination is a reusable pattern
- "One component per responsibility"

## Priority Note

Lower priority (P3) because it's a refactor, not a blocker. However, if pagination is needed in other views soon, elevate priority.

## Future Use Cases

Once extracted, `<Pagination />` can be reused in:
- Ingredient Master list
- Cycle Recommendations list
- Any future paginated list views
