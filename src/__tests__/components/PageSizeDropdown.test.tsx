import { render, screen, fireEvent } from '@testing-library/react';
import { PageSizeDropdown } from '../../components/PageSizeDropdown';

describe('PageSizeDropdown (REQ-019)', () => {
  // TC-019-01 — AC-019-01
  // Given the page-size dropdown is rendered with value 10
  // When it renders
  // Then it shows options 10, 20, 50, and 100 with 10 selected
  it('renders the fixed set of page-size options with the current value selected', () => {
    render(<PageSizeDropdown value={10} onChange={jest.fn()} />);

    const select = screen.getByLabelText<HTMLSelectElement>('Rezepte pro Seite');
    expect(select.value).toBe('10');

    const optionValues = Array.from(select.options).map((option) => option.value);
    expect(optionValues).toEqual(['10', '20', '50', '100']);
  });

  // TC-019-02 — AC-019-02
  // Given the page-size dropdown
  // When the user picks a different page size
  // Then it calls onChange with the selected page size as a number
  it('emits the selected page size as a number', () => {
    const onChange = jest.fn();
    render(<PageSizeDropdown value={10} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('Rezepte pro Seite'), { target: { value: '50' } });

    expect(onChange).toHaveBeenCalledWith(50);
  });
});
