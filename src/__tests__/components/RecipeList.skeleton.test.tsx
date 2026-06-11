import { render, screen } from '@testing-library/react';
import { RecipeList } from '@/components/RecipeList';

jest.mock('@/hooks/useFilter', () => ({
  useFilter: () => ({ selectedIngredients: [] }),
}));

jest.mock('@/hooks/useFetch', () => ({
  useFetch: () => ({ isLoading: true, error: null, data: null, fetch: jest.fn() }),
}));

// TC-007-01
// Given the recipe list is fetching data
// When isLoading is true
// Then animate-pulse skeleton cards are rendered
// And exactly 3 skeleton cards are shown
it('should render 3 skeleton cards while loading', () => {
  render(<RecipeList />);

  const skeletons = document.querySelectorAll('.animate-pulse');
  expect(skeletons).toHaveLength(3);
  expect(screen.queryByText(/werden geladen/i)).toBeNull();
});
