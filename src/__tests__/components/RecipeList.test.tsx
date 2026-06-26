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

  // TC-019-03 — AC-019-02
  // Given RecipeList is rendered with pageSize=20
  // When it fetches recipes
  // Then the request URL includes pageSize=20
  it('includes pageSize in the API request', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ recipes: [], total: 0, page: 1, pageSize: 20, totalPages: 1 }),
    });

    render(
      <FilterProvider>
        <RecipeList pageSize={20} />
      </FilterProvider>
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const requestedUrl = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(requestedUrl).toContain('pageSize=20');
  });

  // TC-019-04 — AC-019-03
  // Given RecipeList is on page 3
  // When the pageSize prop changes
  // Then the next request is made for page=1
  it('resets to page 1 when pageSize changes', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ recipes: [], total: 50, page: 3, pageSize: 10, totalPages: 5 }),
    });

    const { rerender } = render(
      <FilterProvider>
        <RecipeList pageSize={10} />
      </FilterProvider>
    );

    await waitFor(() => {
      const lastUrl = (global.fetch as jest.Mock).mock.calls.at(-1)?.[0] as string;
      expect(lastUrl).toContain('page=3');
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ recipes: [], total: 50, page: 1, pageSize: 50, totalPages: 1 }),
    });

    rerender(
      <FilterProvider>
        <RecipeList pageSize={50} />
      </FilterProvider>
    );

    await waitFor(() => {
      const lastUrl = (global.fetch as jest.Mock).mock.calls.at(-1)?.[0] as string;
      expect(lastUrl).toContain('page=1');
      expect(lastUrl).toContain('pageSize=50');
    });
  });
});
