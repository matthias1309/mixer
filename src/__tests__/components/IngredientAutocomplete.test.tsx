import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IngredientAutocomplete } from '@/components/forms/IngredientAutocomplete';

describe('IngredientAutocomplete', () => {
  test('renders input field', () => {
    render(
      <IngredientAutocomplete
        onSelect={jest.fn()}
        onCreateNew={jest.fn()}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname');
    expect(input).toBeInTheDocument();
  });

  test('shows dropdown after 2+ characters', async () => {
    render(
      <IngredientAutocomplete
        onSelect={jest.fn()}
        onCreateNew={jest.fn()}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname') as HTMLInputElement;

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            ingredients: [
              { id: 1, name: 'Tomato', category: null, base_unit: 'g' },
            ],
          }),
      })
    ) as jest.Mock;

    await userEvent.type(input, 'tom');

    await waitFor(() => {
      expect(screen.getByText('Tomato')).toBeInTheDocument();
    });
  });

  test('does not show dropdown for single character', async () => {
    render(
      <IngredientAutocomplete
        onSelect={jest.fn()}
        onCreateNew={jest.fn()}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname');

    await userEvent.type(input, 't');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  test('calls onSelect with id and name when ingredient clicked', async () => {
    const onSelect = jest.fn();
    render(
      <IngredientAutocomplete
        onSelect={onSelect}
        onCreateNew={jest.fn()}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname') as HTMLInputElement;

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            ingredients: [
              { id: 1, name: 'Tomato', category: null, base_unit: 'g' },
            ],
          }),
      })
    ) as jest.Mock;

    await userEvent.type(input, 'tom');

    await waitFor(() => {
      fireEvent.click(screen.getByText('Tomato'));
    });

    expect(onSelect).toHaveBeenCalledWith({ id: 1, name: 'Tomato' });
  });

  test('shows "Keine Zutaten gefunden" when no results', async () => {
    render(
      <IngredientAutocomplete
        onSelect={jest.fn()}
        onCreateNew={jest.fn()}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ingredients: [] }),
      })
    ) as jest.Mock;

    await userEvent.type(input, 'xyz');

    await waitFor(() => {
      expect(screen.getByText('Keine Zutaten gefunden')).toBeInTheDocument();
    });
  });

  test('shows "Neue Zutat erstellen" button when no matches', async () => {
    const onCreateNew = jest.fn();
    render(
      <IngredientAutocomplete
        onSelect={jest.fn()}
        onCreateNew={onCreateNew}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ ingredients: [] }),
      })
    ) as jest.Mock;

    await userEvent.type(input, 'xyz');

    await waitFor(() => {
      const button = screen.getByText('Neue Zutat erstellen');
      expect(button).toBeInTheDocument();
      fireEvent.click(button);
    });

    expect(onCreateNew).toHaveBeenCalledWith('xyz');
  });

  test('closes dropdown when Escape pressed', async () => {
    render(
      <IngredientAutocomplete
        onSelect={jest.fn()}
        onCreateNew={jest.fn()}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            ingredients: [
              { id: 1, name: 'Tomato', category: null, base_unit: 'g' },
            ],
          }),
      })
    ) as jest.Mock;

    await userEvent.type(input, 'tom');

    await waitFor(() => {
      expect(screen.getByText('Tomato')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByText('Tomato')).not.toBeInTheDocument();
    });
  });

  test('supports arrow key navigation', async () => {
    render(
      <IngredientAutocomplete
        onSelect={jest.fn()}
        onCreateNew={jest.fn()}
        addedIngredientIds={[]}
      />
    );
    const input = screen.getByPlaceholderText('Zutatname');

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            ingredients: [
              { id: 1, name: 'Apple', category: null, base_unit: 'g' },
              { id: 2, name: 'Apricot', category: null, base_unit: 'g' },
            ],
          }),
      })
    ) as jest.Mock;

    await userEvent.type(input, 'ap');

    await waitFor(() => {
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });

    expect(screen.getByText('Apple')).toHaveClass('highlighted');
  });
});
