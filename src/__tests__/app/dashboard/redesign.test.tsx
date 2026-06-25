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

// TC-015-06 — AC-015-08
// Given the dashboard
// When it renders
// Then a search input appears above the results area
it('renders a search input above the results', async () => {
  render(<DashboardPage />);
  await waitFor(() => screen.getByTestId('recipe-list'));

  const searchInput = screen.getByRole('searchbox');
  const recipeList = screen.getByTestId('recipe-list');

  expect(
    searchInput.compareDocumentPosition(recipeList) & Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
});

// AC-015-01 / AC-015-02
// Given the dashboard's own markup (children are mocked)
// When it renders
// Then no bg-blue-600 / text-blue-600 / border-blue-600 literals remain
it('uses design tokens, not blue-* literals', async () => {
  const { container } = render(<DashboardPage />);
  await waitFor(() => screen.getByTestId('recipe-list'));

  expect(container.innerHTML).not.toMatch(/bg-blue-600|text-blue-600|border-blue-600/);
});
