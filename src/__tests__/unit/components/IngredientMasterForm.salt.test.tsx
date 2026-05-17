import { render, screen } from '@testing-library/react';
import { IngredientMasterForm } from '@/components/forms/IngredientMasterForm';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

describe('IngredientMasterForm salt field', () => {
  it('renders Salz label', () => {
    render(<IngredientMasterForm />);
    expect(screen.getByText('Salz')).toBeInTheDocument();
  });

  it('Salz label appears before Natrium label in the DOM', () => {
    render(<IngredientMasterForm />);
    const allLabels = Array.from(document.querySelectorAll('label')).map(l => l.textContent?.trim());
    const salzIdx = allLabels.findIndex(t => t === 'Salz');
    const natriumIdx = allLabels.findIndex(t => t === 'Natrium');
    expect(salzIdx).toBeGreaterThanOrEqual(0);
    expect(natriumIdx).toBeGreaterThanOrEqual(0);
    expect(salzIdx).toBeLessThan(natriumIdx);
  });
});
