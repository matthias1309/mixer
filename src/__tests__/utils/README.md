# Test Utilities

Helper functions and utilities for testing.

## Modules

- **test-utils.tsx** - Custom render function with providers
  - `render()` - Renders components with test providers
  - Re-exports all React Testing Library utilities

## Usage

```typescript
// Import custom render instead of @testing-library/react
import { render, screen } from '@/__tests__/utils/test-utils';

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

## Adding Providers

When adding context/Redux/other providers:
1. Wrap them in `AllTheProviders` component
2. Ensure all tests automatically get the providers
3. Document which providers are active in this README
