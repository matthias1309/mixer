import { render, screen, fireEvent } from '@testing-library/react';
import { StarRating } from '../../components/recipe/StarRating';

describe('StarRating', () => {
  // TC-018-06 — AC-018-08
  it('reflects the current rating and submits a change', () => {
    const onRate = jest.fn();
    render(<StarRating rating={3} onRate={onRate} />);

    const stars = screen.getAllByRole('button', { name: /stern/i });
    expect(stars).toHaveLength(5);
    expect(stars[2]).toHaveAttribute('aria-pressed', 'true');
    expect(stars[3]).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(stars[4]);

    expect(onRate).toHaveBeenCalledWith(5);
  });
});
