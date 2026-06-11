import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '@/components/Navigation';

jest.mock('@/hooks/useWakeLock', () => ({
  useWakeLock: () => ({ isSupported: false, isActive: false, toggle: jest.fn() }),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    logout: jest.fn(),
  }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// TC-006-01
// Given a user views the navigation bar
// When the component renders
// Then a hamburger icon button is present in the DOM
// And the mobile link menu is not rendered initially
it('should render a hamburger button and hide the mobile menu by default', () => {
  // Arrange + Act
  render(<Navigation />);

  // Assert — hamburger button exists
  expect(screen.getByRole('button', { name: /menü öffnen/i })).toBeInTheDocument();

  // Assert — mobile menu not rendered yet
  expect(screen.queryByTestId('mobile-menu')).toBeNull();
});

// TC-006-02
// Given the hamburger menu is closed
// When the user clicks the hamburger button
// Then the mobile menu links become visible in the DOM
it('should open the mobile menu when hamburger is clicked', () => {
  // Arrange
  render(<Navigation />);

  // Act
  fireEvent.click(screen.getByRole('button', { name: /menü öffnen/i }));

  // Assert — mobile menu container rendered
  expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();

  // Assert — nav links present inside the menu
  const menuLinks = screen.getAllByRole('link', { name: /rezepte/i });
  expect(menuLinks.length).toBeGreaterThanOrEqual(1);
});

// TC-006-02 (close)
// Given the mobile menu is open
// When the user clicks the backdrop
// Then the mobile menu closes
it('should close the mobile menu when the backdrop is clicked', () => {
  // Arrange
  render(<Navigation />);
  fireEvent.click(screen.getByRole('button', { name: /menü öffnen/i }));
  expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();

  // Act
  fireEvent.click(screen.getByTestId('mobile-menu-backdrop'));

  // Assert
  expect(screen.queryByTestId('mobile-menu')).toBeNull();
});
