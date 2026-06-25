import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel } from '../../components/FilterPanel';

describe('FilterPanel Component', () => {
  const groups = [
    {
      id: 'phase',
      title: 'Zyklusphase',
      emphasized: true,
      content: <div data-testid="phase-content">Phase</div>,
    },
    {
      id: 'ingredients',
      title: 'Zutaten',
      content: <div data-testid="ingredient-content">Zutaten</div>,
    },
  ];

  // TC-015-07 — AC-015-09
  // Given the filter panel
  // When it renders
  // Then the cycle-phase group appears before the ingredient group
  it('renders the cycle-phase group first', () => {
    render(<FilterPanel groups={groups} onReset={jest.fn()} hasActiveFilters={false} />);

    const phaseHeading = screen.getByRole('button', { name: 'Zyklusphase' });
    const ingredientHeading = screen.getByRole('button', { name: 'Zutaten' });

    expect(
      phaseHeading.compareDocumentPosition(ingredientHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  // TC-015-08 — AC-015-10
  // Given active filters
  // When the reset control is clicked
  // Then onReset is called
  it('clears active filters on reset', () => {
    const onReset = jest.fn();
    render(<FilterPanel groups={groups} onReset={onReset} hasActiveFilters={true} />);

    fireEvent.click(screen.getByRole('button', { name: /filter zurücksetzen/i }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('does not show the reset control when no filters are active', () => {
    render(<FilterPanel groups={groups} onReset={jest.fn()} hasActiveFilters={false} />);

    expect(screen.queryByRole('button', { name: /filter zurücksetzen/i })).not.toBeInTheDocument();
  });
});
