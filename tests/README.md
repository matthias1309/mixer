# Tests Directory

End-to-end tests, test fixtures, and mock data.

## Structure

- **e2e/** - Cypress E2E tests
  - `support/` - Cypress support files (e2e.ts, commands, utilities)
  - `*.cy.ts` - E2E test files
- **fixtures/** - Test data fixtures (mock users, recipes, etc.)
- **mocks/** - Mock implementations (API mocks, handlers, etc.)

## Running Tests

```bash
# Unit/integration tests (Jest)
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report

# E2E tests (Cypress)
npm run test:e2e         # Open interactive mode
npm run test:e2e:ci      # Run in CI mode (headless)
```

## Conventions

- E2E tests: `*.cy.ts` files in `e2e/` directory
- Fixtures: Reusable test data with `mock*` prefix (e.g., `mockUser`)
- Mocks: Mock implementations (MSW handlers, API mocks)
- Coverage target: 80% minimum
