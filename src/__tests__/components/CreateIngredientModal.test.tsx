import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateIngredientModal } from '@/components/modals/CreateIngredientModal';

describe('CreateIngredientModal', () => {
  test('renders modal when open is true', () => {
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={jest.fn()}
        onCreate={jest.fn()}
        suggestedName=""
      />
    );
    expect(screen.getByText('Neue Zutat erstellen')).toBeInTheDocument();
  });

  test('does not render when open is false', () => {
    const { container } = render(
      <CreateIngredientModal
        isOpen={false}
        onClose={jest.fn()}
        onCreate={jest.fn()}
        suggestedName=""
      />
    );
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  test('pre-fills name input with suggestedName', () => {
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={jest.fn()}
        onCreate={jest.fn()}
        suggestedName="Tomato"
      />
    );
    const input = screen.getByPlaceholderText('Zutat-Name (Deutsch)') as HTMLInputElement;
    expect(input.value).toBe('Tomato');
  });

  test('calls onClose when Cancel clicked', () => {
    const onClose = jest.fn();
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={onClose}
        onCreate={jest.fn()}
        suggestedName=""
      />
    );
    const cancelButton = screen.getByRole('button', { name: /Abbrechen/i });
    fireEvent.click(cancelButton);
    expect(onClose).toHaveBeenCalled();
  });

  test('calls onClose when clicking outside modal', () => {
    const onClose = jest.fn();
    const { container } = render(
      <CreateIngredientModal
        isOpen={true}
        onClose={onClose}
        onCreate={jest.fn()}
        suggestedName=""
      />
    );
    const backdrop = container.querySelector('[class*="fixed"]');
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  test('validates name field is not empty', async () => {
    const onCreate = jest.fn();
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={jest.fn()}
        onCreate={onCreate}
        suggestedName=""
      />
    );
    const createButton = screen.getByRole('button', { name: /Erstellen/i });

    fireEvent.click(createButton);

    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByText(/erforderlich/i)).toBeInTheDocument();
  });

  test('calls onCreate with name when form submitted', async () => {
    const onCreate = jest.fn().mockResolvedValue(undefined);
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={jest.fn()}
        onCreate={onCreate}
        suggestedName=""
      />
    );
    const input = screen.getByPlaceholderText('Zutat-Name (Deutsch)');
    const createButton = screen.getByRole('button', { name: /Erstellen/i });

    await userEvent.type(input, 'New Ingredient');
    fireEvent.click(createButton);

    expect(onCreate).toHaveBeenCalledWith('New Ingredient');
  });

  test('trims whitespace from name', async () => {
    const onCreate = jest.fn().mockResolvedValue(undefined);
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={jest.fn()}
        onCreate={onCreate}
        suggestedName=""
      />
    );
    const input = screen.getByPlaceholderText('Zutat-Name (Deutsch)');
    const createButton = screen.getByRole('button', { name: /Erstellen/i });

    await userEvent.type(input, '  New Ingredient  ');
    fireEvent.click(createButton);

    expect(onCreate).toHaveBeenCalledWith('New Ingredient');
  });

  test('shows error when ingredient already exists', async () => {
    const onCreate = jest.fn().mockRejectedValueOnce(
      new Error('Diese Zutat existiert bereits')
    );
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={jest.fn()}
        onCreate={onCreate}
        suggestedName=""
      />
    );
    const input = screen.getByPlaceholderText('Zutat-Name (Deutsch)');
    const createButton = screen.getByRole('button', { name: /Erstellen/i });

    await userEvent.type(input, 'Existing');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/Diese Zutat existiert bereits/i)).toBeInTheDocument();
    });
  });

  test('clears error message when typing', async () => {
    const onCreate = jest.fn().mockRejectedValueOnce(
      new Error('Diese Zutat existiert bereits')
    );
    render(
      <CreateIngredientModal
        isOpen={true}
        onClose={jest.fn()}
        onCreate={onCreate}
        suggestedName=""
      />
    );
    const input = screen.getByPlaceholderText('Zutat-Name (Deutsch)');
    const createButton = screen.getByRole('button', { name: /Erstellen/i });

    await userEvent.type(input, 'Existing');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/Diese Zutat existiert bereits/i)).toBeInTheDocument();
    });

    await userEvent.clear(input);
    await userEvent.type(input, 'New');

    expect(screen.queryByText(/Diese Zutat existiert bereits/i)).not.toBeInTheDocument();
  });
});
