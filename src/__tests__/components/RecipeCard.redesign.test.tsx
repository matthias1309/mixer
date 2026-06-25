import { render, screen } from '@testing-library/react';
import { RecipeCard } from '../../components/RecipeCard';

describe('RecipeCard Component — REWE redesign', () => {
  const mockRecipe = {
    id: 1,
    name: 'Test Recipe',
    description: 'A test recipe',
    creatorName: 'Test User',
    ingredientCount: 5,
    createdAt: '2026-05-14T10:00:00Z',
  };

  // TC-015-01 — AC-015-03
  // Given a recipe card
  // When it renders
  // Then the image comes before the title, and the title before the meta row
  it('renders image before title and a meta row', () => {
    render(<RecipeCard {...mockRecipe} />);

    const image = screen.getByTestId('recipe-card-image');
    const title = screen.getByTestId('recipe-card-title');
    const meta = screen.getByTestId('recipe-card-meta');

    expect(image.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(title.compareDocumentPosition(meta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  // TC-015-02 — AC-015-04
  // Given a recipe card without tags
  // When it renders
  // Then no tag chips are shown
  it('renders no tag chips when tags are absent', () => {
    render(<RecipeCard {...mockRecipe} />);

    expect(screen.queryByTestId('tag-chip')).not.toBeInTheDocument();
  });

  // TC-015-03 — AC-015-05
  // Given a recipe card with a score
  // When it renders
  // Then the score badge is shown
  it('shows the score badge when score is provided', () => {
    render(<RecipeCard {...mockRecipe} score={85} />);

    expect(screen.getByTestId('score-badge')).toHaveTextContent('85');
  });

  // TC-016-10 — AC-016-10
  // Given a recipe card with totalTimeMinutes and difficulty
  // When it renders
  // Then the meta row shows the time and the effort label
  it('renders time and effort in the meta row when present', () => {
    render(<RecipeCard {...mockRecipe} totalTimeMinutes={35} difficulty="easy" />);

    const meta = screen.getByTestId('recipe-card-meta');
    expect(meta).toHaveTextContent('35 min');
    expect(meta).toHaveTextContent('Geringer Aufwand');
  });

  // TC-016-10 — AC-016-10
  // Given a recipe card without totalTimeMinutes or difficulty
  // When it renders
  // Then neither value is shown
  it('omits time and effort when absent', () => {
    render(<RecipeCard {...mockRecipe} />);

    const meta = screen.getByTestId('recipe-card-meta');
    expect(meta).not.toHaveTextContent('min');
    expect(meta).not.toHaveTextContent('Aufwand');
  });

  // TC-016-11 — AC-016-11
  // Given a recipe card with tags
  // When it renders
  // Then the tags are shown as chips in the tag slot
  it('renders tag chips in the tag slot', () => {
    render(<RecipeCard {...mockRecipe} tags={['Vegan', 'Low Carb']} />);

    const chips = screen.getAllByTestId('tag-chip');
    expect(chips.map((c) => c.textContent)).toEqual(['Vegan', 'Low Carb']);
  });
});
