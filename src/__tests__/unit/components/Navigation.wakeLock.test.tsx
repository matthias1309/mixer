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

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    logout: jest.fn(),
  }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('Navigation wake lock toggle', () => {
  beforeEach(() => {
    mockIsSupported = true;
    mockIsActive = false;
    mockToggle.mockClear();
  });

  it('renders wake lock toggle button when supported', () => {
    render(<Navigation />);
    expect(screen.getByRole('button', { name: /bildschirm wach halten/i })).toBeInTheDocument();
  });

  it('does not render toggle when not supported', () => {
    mockIsSupported = false;
    render(<Navigation />);
    expect(screen.queryByRole('button', { name: /bildschirm wach halten/i })).toBeNull();
  });

  it('calls toggle when button is clicked', () => {
    render(<Navigation />);
    fireEvent.click(screen.getByRole('button', { name: /bildschirm wach halten/i }));
    expect(mockToggle).toHaveBeenCalled();
  });

  it('shows active state visually when isActive is true', () => {
    mockIsActive = true;
    render(<Navigation />);
    const button = screen.getByRole('button', { name: /bildschirm wach halten/i });
    expect(button).toHaveClass('bg-yellow-500');
  });
});
