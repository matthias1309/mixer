import { render, screen } from '@testing-library/react';
import { RecipeCard } from '../../components/RecipeCard';

describe('RecipeCard — rating display', () => {
  const baseRecipe = {
    id: 1,
    name: 'Test Recipe',
    description: 'A test recipe',
    creatorName: 'Test User',
    ingredientCount: 5,
    createdAt: '2026-05-14T10:00:00Z',
  };

  // TC-018-05 — AC-018-07
  it('shows average and count when ratingCount > 0', () => {
    render(<RecipeCard {...baseRecipe} ratingAverage={4.7} ratingCount={12} />);

    expect(screen.getByText('4.7 ★ (12)')).toBeInTheDocument();
  });

  // TC-018-05 — AC-018-07
  it('shows a neutral state when there are no ratings', () => {
    render(<RecipeCard {...baseRecipe} ratingAverage={null} ratingCount={0} />);

    expect(screen.getByText('noch keine Bewertung')).toBeInTheDocument();
  });
});
