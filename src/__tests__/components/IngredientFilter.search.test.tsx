import { render, screen, fireEvent } from '@testing-library/react';
import { IngredientFilter } from '@/components/IngredientFilter';

jest.mock('@/hooks/useFilter', () => ({
  useFilter: () => ({
    selectedIngredients: [],
    toggleIngredient: jest.fn(),
    clearFilters: jest.fn(),
  }),
}));

jest.mock('@/hooks/useFetch', () => ({
  useFetch: () => ({
    isLoading: false,
    error: null,
    data: { ingredients: ['Tomate', 'Tofu', 'Brokkoli', 'Karotte'] },
    fetch: jest.fn(),
  }),
}));

// TC-007-02
// Given the ingredient filter shows a list of ingredients
// When the user types in the search field
// Then only matching ingredients are visible
// And clearing the field restores the full list
it('should filter the ingredient list based on search input', () => {
  render(<IngredientFilter />);

  expect(screen.getAllByRole('checkbox')).toHaveLength(4);

  fireEvent.change(screen.getByPlaceholderText(/suchen/i), { target: { value: 'to' } });

  expect(screen.getAllByRole('checkbox')).toHaveLength(2); // Tomate, Tofu
  expect(screen.queryByLabelText(/brokkoli/i)).toBeNull();

  fireEvent.change(screen.getByPlaceholderText(/suchen/i), { target: { value: '' } });

  expect(screen.getAllByRole('checkbox')).toHaveLength(4);
});
