import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUseAuth = jest.fn();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

beforeEach(() => {
  mockPush.mockClear();
});

// TC-004-06
// Given an unauthenticated user
// When they visit /recipes/new (or any ProtectedRoute-wrapped page)
// Then they are redirected to /login
it('should redirect to /login when user is not authenticated', () => {
  // Arrange
  mockUseAuth.mockReturnValue({ user: null, isLoading: false });

  // Act
  render(
    <ProtectedRoute>
      <div>Geschützter Inhalt</div>
    </ProtectedRoute>
  );

  // Assert — redirect triggered, protected content not shown
  expect(mockPush).toHaveBeenCalledWith('/login');
  expect(screen.queryByText('Geschützter Inhalt')).toBeNull();
});

// TC-004-06 (complement — authenticated user passes through)
it('should render children when user is authenticated', () => {
  // Arrange
  mockUseAuth.mockReturnValue({ user: { email: 'test@example.com' }, isLoading: false });

  // Act
  render(
    <ProtectedRoute>
      <div>Geschützter Inhalt</div>
    </ProtectedRoute>
  );

  // Assert — content visible, no redirect
  expect(screen.getByText('Geschützter Inhalt')).toBeInTheDocument();
  expect(mockPush).not.toHaveBeenCalled();
});
