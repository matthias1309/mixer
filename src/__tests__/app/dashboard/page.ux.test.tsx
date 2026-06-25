import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '@/app/dashboard/page';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { email: 'test@example.com', id: 1 } }),
}));

jest.mock('@/hooks/useFilter', () => ({
  useFilter: () => ({
    selectedIngredients: [],
    toggleIngredient: jest.fn(),
    selectedTags: [],
    toggleTag: jest.fn(),
    difficulty: null,
    setDifficulty: jest.fn(),
    maxTime: null,
    setMaxTime: jest.fn(),
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
    json: async () => ({ current_phase: 'follicular' }),
  } as unknown as Response);
});

// TC-005-03
// Given a logged-in user opens the dashboard
// When the page finishes loading
// Then "Rezept erstellen" link appears before the recipe list in the DOM
// And only one button carries the primary filled style
it('should show the primary CTA above the recipe list', async () => {
  // Arrange
  render(<DashboardPage />);
  await waitFor(() => screen.getByTestId('recipe-list'));

  // Act
  const cta = screen.getByRole('link', { name: /\+ rezept erstellen/i });
  const recipeList = screen.getByTestId('recipe-list');

  // Assert — CTA appears before recipe list in document order
  // DOCUMENT_POSITION_FOLLOWING means recipeList comes after cta
  const ctaBeforeList = cta.compareDocumentPosition(recipeList) & Node.DOCUMENT_POSITION_FOLLOWING;
  expect(ctaBeforeList).toBeTruthy();
});

it('should render secondary action links as outlined (not filled) buttons', async () => {
  // Arrange
  render(<DashboardPage />);
  await waitFor(() => screen.getByTestId('recipe-list'));

  // Assert — secondary actions have border class, not solid background
  const photoLink = screen.getByRole('link', { name: /aus foto/i });
  expect(photoLink).toHaveClass('border');
  expect(photoLink).not.toHaveClass('bg-blue-600');
});
