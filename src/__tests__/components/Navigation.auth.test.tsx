import { render, screen } from '@testing-library/react';
import { Navigation } from '@/components/Navigation';

jest.mock('@/hooks/useWakeLock', () => ({
  useWakeLock: () => ({ isSupported: false, isActive: false, toggle: jest.fn() }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockUseAuth = jest.fn();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

// TC-004-09
// Given an unauthenticated user
// When the Navigation component renders
// Then "Rezepte" and "Zutaten" links are visible
// And "Anmelden" and "Registrieren" links are visible
// And "Zyklus" link is NOT visible
// And "Abmelden" button is NOT visible
describe('Navigation — unauthenticated user', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: null, logout: jest.fn() });
  });

  it('should show public links and hide authenticated-only links', () => {
    // Arrange + Act
    render(<Navigation />);

    // Assert — public links visible
    expect(screen.getByRole('link', { name: /rezepte/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /zutaten/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /anmelden/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /registrieren/i })).toBeInTheDocument();

    // Assert — auth-only items hidden
    expect(screen.queryByRole('link', { name: /zyklus/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /abmelden/i })).toBeNull();
  });
});

// TC-004-09 (authenticated)
// Given an authenticated user
// When the Navigation component renders
// Then "Rezepte", "Zutaten" and "Zyklus" links are visible
// And "Abmelden" button is visible
// And "Anmelden" link is NOT visible
describe('Navigation — authenticated user', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { email: 'test@example.com' },
      logout: jest.fn(),
    });
  });

  it('should show auth links and hide guest-only links', () => {
    // Arrange + Act
    render(<Navigation />);

    // Assert — shared links visible
    expect(screen.getByRole('link', { name: /rezepte/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /zutaten/i })).toBeInTheDocument();

    // Assert — auth-only items visible
    expect(screen.getByRole('link', { name: /zyklus/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /abmelden/i })).toBeInTheDocument();

    // Assert — guest-only links hidden
    expect(screen.queryByRole('link', { name: /anmelden/i })).toBeNull();
  });
});
