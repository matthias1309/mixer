import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

jest.mock('@/hooks/useFilter', () => ({
  useFilter: () => ({
    selectedIngredients: [],
    toggleIngredient: jest.fn(),
    clearFilters: jest.fn(),
  }),
}));

jest.mock('@/contexts/FilterContext', () => ({
  FilterProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/components/RecipeList', () => ({
  RecipeList: () => <div data-testid="recipe-list">Rezeptliste</div>,
}));

jest.mock('@/components/IngredientFilter', () => ({
  IngredientFilter: () => <div data-testid="ingredient-filter">Zutatenfilter</div>,
}));

jest.mock('@/components/recipe/PhaseFilter', () => ({
  __esModule: true,
  default: () => <div data-testid="phase-filter">Phasenfilter</div>,
}));

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ current_phase: null }),
  } as unknown as Response);
});

// TC-004-01
// Given an unauthenticated user (no session cookie)
// When they visit /dashboard
// Then the recipe list is rendered
// And no redirect to /login occurs
it('should render the recipe list for an unauthenticated user without redirecting', async () => {
  // Arrange + Act
  render(<DashboardPage />);

  // Assert — recipe list visible, not a login redirect
  await waitFor(() => expect(screen.getByTestId('recipe-list')).toBeInTheDocument());
});

// TC-004-03
// Given an unauthenticated user on /dashboard
// When the page loads
// Then IngredientFilter and PhaseFilter components are rendered
it('should render IngredientFilter and PhaseFilter for an unauthenticated user', async () => {
  // Arrange + Act
  render(<DashboardPage />);

  // Assert
  await waitFor(() => {
    expect(screen.getByTestId('ingredient-filter')).toBeInTheDocument();
    expect(screen.getByTestId('phase-filter')).toBeInTheDocument();
  });
});
