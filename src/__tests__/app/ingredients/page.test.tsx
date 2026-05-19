import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IngredientsPage from '../../../app/ingredients/page';

// Mock fetch
global.fetch = jest.fn();

// Mock ProtectedRoute to bypass auth
jest.mock('../../../components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('IngredientsPage - Pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display pagination controls when there are multiple pages', async () => {
    const mockIngredients = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Ingredient ${i + 1}`,
      category: 'Category',
      kcal: 10,
      protein: 1,
      fat: 1,
      carbohydrates: 1,
    }));

    // Mock first page
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ingredients: mockIngredients,
        total: 45,
        page: 1,
        pageSize: 20,
        totalPages: 3,
      }),
    });

    render(<IngredientsPage />);

    // Wait for table to appear (not loading state)
    await waitFor(() => {
      expect(screen.queryByText('Zutaten werden geladen...')).not.toBeInTheDocument();
    });

    // Should show pagination info
    const paginationText = await screen.findByText(/Seite 1 von 3/i);
    expect(paginationText).toBeInTheDocument();

    // Should show next button
    expect(screen.getByRole('button', { name: /nächste/i })).toBeInTheDocument();
  });

  it('should navigate to next page when next button is clicked', async () => {
    const mockPage1 = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Ingredient ${i + 1}`,
      category: 'Category',
      kcal: 10,
      protein: 1,
      fat: 1,
      carbohydrates: 1,
    }));

    const mockPage2 = Array.from({ length: 20 }, (_, i) => ({
      id: i + 21,
      name: `Ingredient ${i + 21}`,
      category: 'Category',
      kcal: 10,
      protein: 1,
      fat: 1,
      carbohydrates: 1,
    }));

    // Mock first page
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ingredients: mockPage1,
        total: 45,
        page: 1,
        pageSize: 20,
        totalPages: 3,
      }),
    });

    render(<IngredientsPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Zutaten werden geladen...')).not.toBeInTheDocument();
    });

    // Mock second page fetch
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ingredients: mockPage2,
        total: 45,
        page: 2,
        pageSize: 20,
        totalPages: 3,
      }),
    });

    const nextButton = screen.getByRole('button', { name: /nächste/i });
    fireEvent.click(nextButton);

    // Should show page 2 and ingredients from page 2
    await waitFor(() => {
      expect(screen.getByText(/Seite 2 von 3/i)).toBeInTheDocument();
      expect(screen.getByText('Ingredient 21')).toBeInTheDocument();
    });
  });
});
