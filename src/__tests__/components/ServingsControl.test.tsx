import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ServingsControl } from '../../components/recipe/ServingsControl';

describe('ServingsControl', () => {
  const defaultProps = {
    servings: 4,
    originalServings: 4,
    isLoading: false,
    onDecrease: jest.fn(),
    onIncrease: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders current serving count', () => {
    render(<ServingsControl {...defaultProps} />);
    expect(screen.getByText('4 Portionen')).toBeInTheDocument();
  });

  it('renders singular form for 1 serving', () => {
    render(<ServingsControl {...defaultProps} servings={1} />);
    expect(screen.getByText('1 Portion')).toBeInTheDocument();
  });

  it('calls onIncrease when + button is clicked', async () => {
    render(<ServingsControl {...defaultProps} />);
    await userEvent.click(screen.getByLabelText('Portionen erhöhen'));
    expect(defaultProps.onIncrease).toHaveBeenCalledTimes(1);
  });

  it('calls onDecrease when − button is clicked', async () => {
    render(<ServingsControl {...defaultProps} />);
    await userEvent.click(screen.getByLabelText('Portionen verringern'));
    expect(defaultProps.onDecrease).toHaveBeenCalledTimes(1);
  });

  it('disables both buttons while loading', () => {
    render(<ServingsControl {...defaultProps} isLoading={true} />);
    expect(screen.getByLabelText('Portionen verringern')).toBeDisabled();
    expect(screen.getByLabelText('Portionen erhöhen')).toBeDisabled();
  });

  it('disables decrease button at minimum (1)', () => {
    render(<ServingsControl {...defaultProps} servings={1} />);
    expect(screen.getByLabelText('Portionen verringern')).toBeDisabled();
    expect(screen.getByLabelText('Portionen erhöhen')).not.toBeDisabled();
  });

  it('disables increase button at maximum (100)', () => {
    render(<ServingsControl {...defaultProps} servings={100} />);
    expect(screen.getByLabelText('Portionen erhöhen')).toBeDisabled();
    expect(screen.getByLabelText('Portionen verringern')).not.toBeDisabled();
  });

  it('shows original servings hint when scaled', () => {
    render(<ServingsControl {...defaultProps} servings={8} originalServings={4} />);
    expect(screen.getByText('(Original: 4)')).toBeInTheDocument();
  });

  it('hides original servings hint when not scaled', () => {
    render(<ServingsControl {...defaultProps} servings={4} originalServings={4} />);
    expect(screen.queryByText(/Original/)).not.toBeInTheDocument();
  });

  it('shows loading indicator while scaling', () => {
    render(<ServingsControl {...defaultProps} isLoading={true} />);
    expect(screen.getByText('…')).toBeInTheDocument();
  });
});
