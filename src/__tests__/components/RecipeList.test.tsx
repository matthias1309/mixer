import { render, screen, waitFor } from '@testing-library/react';
import { RecipeList } from '../../components/RecipeList';
import { FilterProvider } from '../../contexts/FilterContext';

// Mock fetch
global.fetch = jest.fn();

describe('RecipeList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recipes: [], total: 0, page: 1, pageSize: 10, totalPages: 1 }),
    });

    render(
      <FilterProvider>
        <RecipeList />
      </FilterProvider>
    );

    // Component should render without crashing
    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('should display error message on failed fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to fetch recipes' }),
    });

    render(
      <FilterProvider>
        <RecipeList />
      </FilterProvider>
    );

    // Wait for error to appear and verify it's displayed
    await new Promise((resolve) => setTimeout(resolve, 150));
    expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
  });

  // TC-015-09 — AC-015-11
  // Given recipes were fetched successfully
  // When the list renders
  // Then a results counter shows the number of matching recipes
  it('shows the number of matching recipes', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        recipes: [
          {
            id: 1,
            name: 'Recipe One',
            description: null,
            creatorName: 'User',
            ingredientCount: 3,
            createdAt: '2026-05-14T10:00:00Z',
          },
          {
            id: 2,
            name: 'Recipe Two',
            description: null,
            creatorName: 'User',
            ingredientCount: 4,
            createdAt: '2026-05-14T10:00:00Z',
          },
        ],
        total: 2,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      }),
    });

    render(
      <FilterProvider>
        <RecipeList />
      </FilterProvider>
    );

    await waitFor(() => expect(screen.getByTestId('results-counter')).toBeInTheDocument());
    expect(screen.getByTestId('results-counter')).toHaveTextContent('2 Rezepte gefunden');
  });
});
