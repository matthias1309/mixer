# BUG-003: Unsafe `any` Type in RecipeList Component

**Type**: Bug  
**Effort**: 1 story point  
**Priority**: P1 (Blocker)  
**Status**: Done  
**Phase**: Type Safety  
**Order**: 3rd  

---

## Description

RecipeList.tsx uses `any` type in production code, violating TypeScript strict mode and the CLAUDE.md requirement of "TypeScript for all code (strict mode)" with "No `any` types".

## Root Cause

Line 55 in `src/components/RecipeList.tsx`:
```typescript
const filteredRecipes = data.recipes.filter((recipe: any) => {
  // ...
});
```

Using `any` bypasses type safety for recipes in the filter operation.

## Acceptance Criteria

- [ ] Replace `any` with proper type `RecipeCardProps`
- [ ] TypeScript compiler passes without errors: `npm run build`
- [ ] No type errors in IDE
- [ ] Tests still pass: `npm test -- RecipeList`

## Implementation

Change line 55 from:
```typescript
const filteredRecipes = data.recipes.filter((recipe: any) => {
```

To:
```typescript
const filteredRecipes = data.recipes.filter((recipe: RecipeCardProps) => {
```

## Testing

```bash
npm run build
npm test -- RecipeList.test.tsx
```

Should see: ✅ No errors, tests PASS

## Definition of Done

- [ ] No `any` types in code
- [ ] TypeScript build passes
- [ ] Tests pass
- [ ] Code review approved

## Related Files

- `src/components/RecipeList.tsx` (line 55)
- `src/components/RecipeCard.tsx` (imports `RecipeCardProps` from here)

## CLAUDE.md Requirement

Section "Development Guidelines" → "Code Style":
- "TypeScript for all code (strict mode)"
- From checklist: "No `any` types — Every variable/function parameter has an explicit type"
