# ADR-005: Test-Driven Development with Jest

**Status**: Accepted  
**Date**: 2026-05-19  
**Context**: Project requires high code quality and reliability. Testing strategy must support TDD methodology.

## Decision

Implement Test-Driven Development (TDD) approach using Jest as primary testing framework, with React Testing Library for component tests and Cypress for E2E tests.

**Testing Strategy**:
- Write tests BEFORE implementation code
- Minimum 80% code coverage target
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows

## Test Organization

**Directory Structure**:
```
src/__tests__/
├── components/           # React component tests
│   └── RecipeCard.test.tsx
├── unit/                # Business logic tests
│   └── api/
│       └── recipes/
│           └── route.test.ts
└── integration/         # API and database tests
    └── cycle/cycle-api.test.ts

tests/
├── e2e/                 # Cypress E2E tests
└── fixtures/           # Test data
```

## Framework Selection Rationale

| Framework | Purpose | Why |
|-----------|---------|-----|
| Jest | Unit/Integration | Fast, built into Next.js, great for Node.js |
| React Testing Library | Components | User-centric testing, encourages good practices |
| Cypress | E2E | Visual debugging, excellent developer experience |

## Coverage Requirements

- **Global target**: 80%+ for statements, branches, functions, lines
- **Module minimum**: No module below 70% coverage
- **CI gate**: Build fails if coverage drops below threshold

## Test Patterns

### Unit Test Example
```typescript
describe('RecipeModel', () => {
  it('should create recipe with required fields', () => {
    const recipe = RecipeModel.create({...});
    expect(recipe.name).toBe('Test Recipe');
  });
});
```

### Integration Test Example
```typescript
describe('GET /api/recipes', () => {
  it('should return paginated recipes', async () => {
    const response = await fetch('/api/recipes?page=1');
    expect(response.status).toBe(200);
  });
});
```

## Test Execution

```bash
npm test                  # Run all tests
npm run test:coverage     # Generate coverage report
npm run test:watch       # Watch mode
```

## Consequences

**Advantages**:
- Catches bugs early
- Documents expected behavior
- Refactoring confidence
- High code quality threshold

**Disadvantages**:
- Upfront time investment
- More code to maintain
- Test updates when behavior changes

## Related Files

- `jest.config.js` (configuration)
- `src/__tests__/` (test suite)
- `tests/e2e/` (E2E tests)
- Package.json test scripts
