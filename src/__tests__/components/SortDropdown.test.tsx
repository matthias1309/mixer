import { render, screen, fireEvent } from '@testing-library/react';
import { SortDropdown } from '../../components/SortDropdown';

describe('SortDropdown (REQ-017)', () => {
  // TC-017-09 — AC-017-09
  // Given the sort dropdown
  // When the user picks a different sort order
  // Then it emits the selected sort value
  it('emits the selected sort value', () => {
    const onChange = jest.fn();
    render(<SortDropdown value="newest" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Sortierung'), { target: { value: 'time' } });

    expect(onChange).toHaveBeenCalledWith('time');
  });

  it('reflects the current value', () => {
    render(<SortDropdown value="time" onChange={jest.fn()} />);

    expect(screen.getByLabelText<HTMLSelectElement>('Sortierung').value).toBe('time');
  });
});
