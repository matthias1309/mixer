import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecipeDetailPage from '@/app/recipes/[id]/page';

const mockRecipe = {
  id: 1,
  name: 'Test Rezept',
  description: 'Eine leckere Beschreibung',
  instructions: 'Schritt 1: Kochen. Schritt 2: Essen.',
  servings: 2,
  creatorName: 'Max',
  creatorId: 1,
  ingredients: [{ id: 1, name: 'Salz', quantity: 1, unit: 'g' }],
  nutrients: { kcal: 250, protein: 10, fat: 5, carbohydrates: 30 },
  canEdit: false,
  canDelete: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

jest.mock('@/hooks/useFilter', () => ({
  useFilter: () => ({ selectedIngredients: [] }),
}));

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockRecipe,
  } as unknown as Response);
});

// TC-005-01
// Given a user opens a recipe detail page
// When the page finishes loading
// Then content appears in order: description → ingredients → instructions → nutrients
it('should render ingredients before instructions, and instructions before nutrients', async () => {
  // Arrange
  render(<RecipeDetailPage />);
  await waitFor(() => screen.getByText('Test Rezept'));

  // Act
  const ingredientText = screen.getByText(/1 g Salz/);
  const instructionText = screen.getByText(/Schritt 1/);
  const nutrientToggle = screen.getByRole('button', { name: /nährwerte/i });

  // Assert — ingredients appear before instructions in DOM
  const ingredientsBeforeInstructions =
    ingredientText.compareDocumentPosition(instructionText) & Node.DOCUMENT_POSITION_FOLLOWING;
  expect(ingredientsBeforeInstructions).toBeTruthy();

  // Assert — instructions appear before nutrients toggle in DOM
  const instructionsBeforeNutrients =
    instructionText.compareDocumentPosition(nutrientToggle) & Node.DOCUMENT_POSITION_FOLLOWING;
  expect(instructionsBeforeNutrients).toBeTruthy();
});

// TC-005-02
// Given a user opens a recipe detail page with nutrient data
// When the page finishes loading
// Then nutrient values are not visible
// And when the user clicks the nutrients toggle, they become visible
it('should hide nutrients by default and show them after clicking the toggle', async () => {
  // Arrange
  render(<RecipeDetailPage />);
  await waitFor(() => screen.getByText('Test Rezept'));

  // Assert — kcal value not visible before toggle
  expect(screen.queryByText(/250\.00 kcal|250 kcal/)).toBeNull();

  // Act — expand
  fireEvent.click(screen.getByRole('button', { name: /nährwerte/i }));

  // Assert — kcal value visible after toggle
  expect(screen.getByText(/250\.00 kcal/)).toBeInTheDocument();
});
