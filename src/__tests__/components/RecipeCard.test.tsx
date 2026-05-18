import { render, screen } from '@testing-library/react';
import { RecipeCard } from '../../components/RecipeCard';

describe('RecipeCard Component', () => {
  const mockRecipe = {
    id: 1,
    name: 'Test Recipe',
    description: 'A test recipe',
    creatorName: 'Test User',
    ingredientCount: 5,
    createdAt: '2026-05-14T10:00:00Z',
  };

  it('should render recipe card with all information', () => {
    render(<RecipeCard {...mockRecipe} />);

    expect(screen.getByText('Test Recipe')).toBeInTheDocument();
    expect(screen.getByText('von Test User')).toBeInTheDocument();
    expect(screen.getByText('A test recipe')).toBeInTheDocument();
    expect(screen.getByText('5 Zutaten')).toBeInTheDocument();
  });

  it('should link to recipe detail page', () => {
    render(<RecipeCard {...mockRecipe} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/recipes/1');
  });

  it('should not render description if null', () => {
    const recipeWithoutDesc = { ...mockRecipe, description: null };
    render(<RecipeCard {...recipeWithoutDesc} />);

    expect(screen.queryByText('A test recipe')).not.toBeInTheDocument();
  });
});
