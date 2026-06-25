import { render, screen } from '@testing-library/react';
import { RecipeImage } from '../../components/RecipeImage';

describe('RecipeImage Component', () => {
  // TC-015-04
  // Given a recipe with an imagePath
  // When RecipeImage renders
  // Then the real photo is shown
  it('renders the photo when imagePath is set', () => {
    render(<RecipeImage id={1} name="Test Recipe" imagePath="/uploads/1.jpg" />);

    const image = screen.getByRole('img', { name: 'Test Recipe' });
    expect(image.tagName).toBe('IMG');
    expect(image).toHaveAttribute('src', expect.stringContaining('/api/recipes/1/image'));
  });

  // TC-015-05
  // Given a recipe without an imagePath
  // When RecipeImage renders
  // Then a gradient placeholder with the recipe name is shown instead
  it('renders a deterministic gradient + recipe name when imagePath is null', () => {
    render(<RecipeImage id={2} name="Placeholder Recipe" imagePath={null} />);

    const placeholder = screen.getByRole('img', { name: 'Placeholder Recipe' });
    expect(placeholder.tagName).not.toBe('IMG');
    expect(screen.getByText('Placeholder Recipe')).toBeInTheDocument();
  });

  // TC-015-05
  // Given two RecipeImage renders for the same recipe id without an image
  // When the gradient is derived from the id
  // Then the same gradient class is produced both times (pure function, no randomness)
  it('produces the same gradient for the same id', () => {
    const { container: first } = render(<RecipeImage id={42} name="Recipe A" imagePath={null} />);
    const { container: second } = render(<RecipeImage id={42} name="Recipe A" imagePath={null} />);

    const firstPlaceholder = first.querySelector('[role="img"]');
    const secondPlaceholder = second.querySelector('[role="img"]');

    expect(firstPlaceholder?.className).toBe(secondPlaceholder?.className);
  });
});
