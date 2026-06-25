import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import IngredientsPage from '../../../app/ingredients/page';

global.fetch = jest.fn();

// Mock useAuth — page is public, no login required
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

// TC-004-04: page renders for unauthenticated users (useAuth returns user: null throughout)
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

// TC-004-05
// Given an unauthenticated user on /ingredients
// Then no "Zutat hinzufügen" button is rendered
// And no "Aktionen" column header is rendered
describe('IngredientsPage - CRUD controls hidden for guests', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        ingredients: [
          { id: 1, name: 'Mehl', category: 'Getreide', kcal: 350, protein: 10, fat: 1, carbohydrates: 72 },
        ],
        total: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      }),
    });
  });

  it('should not render the "Zutat hinzufügen" button for unauthenticated users', async () => {
    render(<IngredientsPage />);

    await waitFor(() => expect(screen.getByText('Mehl')).toBeInTheDocument());

    expect(screen.queryByRole('button', { name: /zutat hinzufügen/i })).toBeNull();
    expect(screen.queryByText(/\+ zutat hinzufügen/i)).toBeNull();
  });

  it('should not render the "Aktionen" column header for unauthenticated users', async () => {
    render(<IngredientsPage />);

    await waitFor(() => expect(screen.getByText('Mehl')).toBeInTheDocument());

    expect(screen.queryByRole('columnheader', { name: /aktionen/i })).toBeNull();
  });
});
