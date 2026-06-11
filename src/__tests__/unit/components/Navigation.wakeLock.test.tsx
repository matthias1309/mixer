import { render, screen, fireEvent } from '@testing-library/react';
import { Navigation } from '@/components/Navigation';

const mockToggle = jest.fn();
let mockIsSupported = true;
let mockIsActive = false;

jest.mock('@/hooks/useWakeLock', () => ({
  useWakeLock: () => ({
    isSupported: mockIsSupported,
    isActive: mockIsActive,
    toggle: mockToggle,
  }),
}));

let mockUser: { email: string } | null = { email: 'test@example.com' };

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: jest.fn(),
  }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// The Navigation renders two wake-lock buttons: one in the desktop bar (hidden md:flex)
// and one in the mobile bar (flex md:hidden). JSDOM does not apply CSS media queries,
// so both are present in the DOM at test time. Tests use getAllByRole and check [0].
describe('Navigation wake lock toggle', () => {
  beforeEach(() => {
    mockIsSupported = true;
    mockIsActive = false;
    mockUser = { email: 'test@example.com' };
    mockToggle.mockClear();
  });

  it('renders wake lock toggle button when supported', () => {
    render(<Navigation />);
    const buttons = screen.getAllByRole('button', { name: /bildschirm wach halten/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render toggle when not supported', () => {
    mockIsSupported = false;
    render(<Navigation />);
    expect(screen.queryByRole('button', { name: /bildschirm wach halten/i })).toBeNull();
  });

  it('calls toggle when button is clicked', () => {
    render(<Navigation />);
    fireEvent.click(screen.getAllByRole('button', { name: /bildschirm wach halten/i })[0]);
    expect(mockToggle).toHaveBeenCalled();
  });

  it('shows active state visually when isActive is true', () => {
    mockIsActive = true;
    render(<Navigation />);
    const buttons = screen.getAllByRole('button', { name: /bildschirm wach halten/i });
    buttons.forEach((btn) => expect(btn).toHaveClass('text-yellow-300'));
  });

  it('renders wake lock toggle for non-logged-in users when supported', () => {
    mockUser = null;
    render(<Navigation />);
    const buttons = screen.getAllByRole('button', { name: /bildschirm wach halten/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  // TC-005-05
  // Given any user views the navigation bar
  // When the wake lock button is displayed
  // Then the button does not contain the text "Bildschirm: AN" or "Bildschirm: AUS"
  // And the button contains an SVG element
  // And the active/inactive state is visually distinguishable via CSS class
  it('should show an SVG icon instead of text label on the wake lock button', () => {
    // Arrange
    render(<Navigation />);
    const buttons = screen.getAllByRole('button', { name: /bildschirm wach halten/i });

    buttons.forEach((button) => {
      // Assert — no text label
      expect(button).not.toHaveTextContent('Bildschirm: AUS');
      expect(button).not.toHaveTextContent('Bildschirm: AN');
      // Assert — SVG icon present
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  it('should apply a distinguishable CSS class to the icon when active vs inactive', () => {
    // Arrange — inactive
    render(<Navigation />);
    const inactiveButtons = screen.getAllByRole('button', { name: /bildschirm wach halten/i });
    inactiveButtons.forEach((btn) => expect(btn).toHaveClass('opacity-50'));

    // Re-render active state
    mockIsActive = true;
    const { unmount } = render(<Navigation />);
    const activeButtons = screen.getAllByRole('button', { name: /bildschirm wach halten/i });
    // Only the newly rendered ones (second render) should be active
    const freshActive = activeButtons.slice(inactiveButtons.length);
    freshActive.forEach((btn) => expect(btn).toHaveClass('text-yellow-300'));
    unmount();
  });
});
