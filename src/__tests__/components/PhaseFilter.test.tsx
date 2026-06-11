import { render, screen, fireEvent } from '@testing-library/react';
import PhaseFilter from '@/components/recipe/PhaseFilter';

const mockOnFilterChange = jest.fn();

beforeEach(() => {
  mockOnFilterChange.mockClear();
});

// TC-005-04
// Given a user is on the dashboard
// When they look at the phase filter
// Then no <select> dropdown is present
// And four clickable phase buttons are visible
// And the currently active phase button is visually highlighted
// And clicking a chip calls onFilterChange with the correct phase
it('should render phase chips instead of a dropdown select', () => {
  // Arrange
  render(<PhaseFilter onFilterChange={mockOnFilterChange} currentPhase="follicular" />);

  // Assert — no select element
  expect(screen.queryByRole('combobox')).toBeNull();

  // Assert — four phase buttons present
  expect(screen.getByRole('button', { name: /menstruation/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /follikul/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /ovulation/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /luteal/i })).toBeInTheDocument();
});

it('should highlight the active phase chip', () => {
  // Arrange
  render(<PhaseFilter onFilterChange={mockOnFilterChange} currentPhase="follicular" />);

  // Act
  const follicularChip = screen.getByRole('button', { name: /follikul/i });

  // Assert — active chip has a filled background class (not the grey inactive class)
  expect(follicularChip).toHaveClass('bg-yellow-400');
  expect(follicularChip).not.toHaveClass('bg-gray-100');
});

it('should call onFilterChange with correct phase when a chip is clicked', () => {
  // Arrange
  render(<PhaseFilter onFilterChange={mockOnFilterChange} currentPhase="follicular" />);

  // Act
  fireEvent.click(screen.getByRole('button', { name: /ovulation/i }));

  // Assert
  expect(mockOnFilterChange).toHaveBeenCalledWith('ovulation', expect.any(Number));
});
