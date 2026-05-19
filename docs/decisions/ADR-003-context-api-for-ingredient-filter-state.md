# ADR-003: Context API for Ingredient Filter State

**Status**: Accepted  
**Date**: 2026-05-19  
**Context**: Application needs global filter state (selected ingredients) accessible across multiple components without prop drilling.

## Decision

Implement React Context API with custom hooks for managing ingredient filter state globally.

**Architecture**:
- **FilterContext**: Global state container for selected ingredients
- **useFilter()**: Custom hook for consuming filter state
- **Provider**: Wrap application at root level

## Consequences

**Advantages**:
- Eliminates prop drilling (passing state through many levels)
- Clean separation of concerns
- Easy to test with mocking context values
- Built into React (no external dependencies)

**Disadvantages**:
- Context rerenders all consumers when state changes
- Not suitable for frequently-changing state (performance issue)
- Overkill for simple local state

## Why Not Redux/Zustand?

- **MVP Phase**: Simpler state requirements
- **Bundle size**: Context is built-in, no extra dependencies
- **Learning curve**: Team familiar with React Context
- **Scalability**: Can migrate to Redux later if needed

## Implementation Details

- **Location**: `src/contexts/FilterContext.tsx`
- **Hook**: `src/hooks/useFilter.ts`
- **Provider wrapping**: `src/app/layout.tsx`

**useFilter Hook Returns**:
```typescript
{
  selectedIngredients: string[];
  toggleIngredient: (ingredient: string) => void;
  clearFilters: () => void;
}
```

## Usage Example

```typescript
const { selectedIngredients, toggleIngredient } = useFilter();
```

## Performance Considerations

- Filter state is relatively static (only changed on user action)
- Reasonable number of subscribers (RecipeList, IngredientFilter)
- Can be optimized with memo() if needed

## Related Files

- `src/contexts/FilterContext.tsx` (context definition)
- `src/hooks/useFilter.ts` (custom hook)
- `src/components/IngredientFilter.tsx` (consumer)
- `src/components/RecipeList.tsx` (consumer)
