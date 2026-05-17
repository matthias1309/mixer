import { render, screen } from '@testing-library/react';
import { IngredientMasterForm } from '@/components/forms/IngredientMasterForm';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

describe('IngredientMasterForm German labels', () => {
  it('displays Eisen instead of Iron', () => {
    render(<IngredientMasterForm />);
    expect(screen.queryByText('Iron')).toBeNull();
    expect(screen.getByText('Eisen')).toBeInTheDocument();
  });

  it('displays Zink instead of Zinc', () => {
    render(<IngredientMasterForm />);
    expect(screen.queryByText('Zinc')).toBeNull();
    expect(screen.getByText('Zink')).toBeInTheDocument();
  });
});
