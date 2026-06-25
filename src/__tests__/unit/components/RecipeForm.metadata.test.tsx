import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipeForm } from '@/components/forms/RecipeForm';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn() }),
}));

const originalFetch = global.fetch;

describe('RecipeForm — metadata inputs (REQ-016)', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 42 }),
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  // TC-016-09 — AC-016-09
  // Given the recipe form
  // When it renders
  // Then effort, time, mealType, and tag inputs are present, and submitting
  // sends the chosen values to the API
  it('renders effort/time/mealType/tags inputs and submits them', async () => {
    render(<RecipeForm />);

    fireEvent.change(screen.getByLabelText('Rezeptname *'), {
      target: { value: 'Veganes Curry' },
    });

    fireEvent.change(screen.getByLabelText('Aufwand'), { target: { value: 'easy' } });
    fireEvent.change(screen.getByLabelText('Gesamtzeit (Minuten)'), { target: { value: '35' } });
    fireEvent.change(screen.getByLabelText('Gang'), { target: { value: 'Hauptspeise' } });
    fireEvent.click(screen.getByLabelText('Vegan'));

    fireEvent.click(screen.getByRole('button', { name: /Rezept erstellen/ }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(options.body);

    expect(body.difficulty).toBe('easy');
    expect(body.totalTimeMinutes).toBe(35);
    expect(body.mealType).toBe('Hauptspeise');
    expect(body.tags).toEqual(['Vegan']);
  });

  // TC-016-09 — AC-016-09
  // Given an existing recipe with metadata
  // When the form is opened for editing
  // Then the metadata inputs are pre-filled
  it('pre-fills metadata when editing', () => {
    render(
      <RecipeForm
        isEditing
        initialData={{
          id: 7,
          name: 'Veganes Curry',
          description: null,
          instructions: null,
          servings: 2,
          ingredients: [],
          difficulty: 'medium',
          totalTimeMinutes: 45,
          mealType: 'Hauptspeise',
          tags: ['Vegan', 'Low Carb'],
        }}
      />
    );

    expect(screen.getByLabelText('Aufwand')).toHaveValue('medium');
    expect(screen.getByLabelText('Gesamtzeit (Minuten)')).toHaveValue(45);
    expect(screen.getByLabelText('Gang')).toHaveValue('Hauptspeise');
    expect(screen.getByLabelText('Vegan')).toBeChecked();
    expect(screen.getByLabelText('Low Carb')).toBeChecked();
  });
});
