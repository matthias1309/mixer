import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RecipeDetailPage from '@/app/recipes/[id]/page';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { email: 'test@example.com', id: 1 } }),
}));

jest.mock('@/hooks/useFilter', () => ({
  useFilter: () => ({ selectedIngredients: [] }),
}));

const mockRecipe = {
  id: 1,
  name: 'Pasta al Limone',
  description: 'Ein tolles Rezept',
  instructions: 'Kochen und genießen.',
  servings: 2,
  creatorName: 'Max',
  creatorId: 1,
  ingredients: [{ id: 1, name: 'Pasta', quantity: 200, unit: 'g' }],
  nutrients: null,
  canEdit: true,
  canDelete: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => {
  mockPush.mockClear();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockRecipe,
  } as unknown as Response);
  window.confirm = jest.fn();
});

// TC-006-03
// Given a logged-in user is on a recipe detail page they can delete
// When they click the "Löschen" button
// Then a confirmation modal appears in the page
// And window.confirm is never called
it('should open a modal instead of calling window.confirm when Löschen is clicked', async () => {
  // Arrange
  render(<RecipeDetailPage />);
  await waitFor(() => screen.getByText('Pasta al Limone'));

  // Act
  fireEvent.click(screen.getByRole('button', { name: /^löschen$/i }));

  // Assert — modal heading visible
  expect(screen.getByRole('heading', { name: /rezept löschen/i })).toBeInTheDocument();
  expect(screen.getByText(/„Pasta al Limone“/)).toBeInTheDocument();

  // Assert — no browser confirm
  expect(window.confirm).not.toHaveBeenCalled();
});

// TC-006-04
// Given the delete confirmation modal is open
// When the user clicks "Abbrechen"
// Then the modal closes and no DELETE request is sent
it('should close the modal and not delete when Abbrechen is clicked', async () => {
  // Arrange
  render(<RecipeDetailPage />);
  await waitFor(() => screen.getByText('Pasta al Limone'));
  fireEvent.click(screen.getByRole('button', { name: /^löschen$/i }));
  expect(screen.getByRole('heading', { name: /rezept löschen/i })).toBeInTheDocument();

  // Act
  fireEvent.click(screen.getByRole('button', { name: /abbrechen/i }));

  // Assert — modal gone
  expect(screen.queryByRole('heading', { name: /rezept löschen/i })).toBeNull();

  // Assert — no DELETE request (fetch only called once for the initial GET)
  const calls = (global.fetch as jest.Mock).mock.calls;
  expect(calls.every(([, opts]) => !opts || opts.method !== 'DELETE')).toBe(true);
});

// TC-006-05
// Given the delete confirmation modal is open
// When the user clicks "Löschen" inside the modal
// Then a DELETE request is sent and the user is redirected
it('should send DELETE request and redirect when confirmed in modal', async () => {
  // Arrange
  global.fetch = jest
    .fn()
    .mockResolvedValueOnce({ ok: true, json: async () => mockRecipe } as unknown as Response)
    .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as unknown as Response);

  render(<RecipeDetailPage />);
  await waitFor(() => screen.getByText('Pasta al Limone'));
  fireEvent.click(screen.getByRole('button', { name: /^löschen$/i }));

  // Act — click the confirm button inside the modal
  fireEvent.click(screen.getByRole('button', { name: /ja, löschen/i }));

  // Assert
  await waitFor(() => {
    const calls = (global.fetch as jest.Mock).mock.calls;
    const deleteCall = calls.find(([, opts]) => opts?.method === 'DELETE');
    expect(deleteCall).toBeDefined();
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});
