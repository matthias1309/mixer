import HomePage from '@/app/page';

const mockRedirect = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (path: string) => mockRedirect(path),
}));

// TC-MAINT-003-02: root page redirect is base-path aware
describe('HomePage', () => {
  const originalBasePath = process.env.NEXT_PUBLIC_BASE_PATH;

  afterEach(() => {
    mockRedirect.mockClear();
    if (originalBasePath === undefined) {
      delete process.env.NEXT_PUBLIC_BASE_PATH;
    } else {
      process.env.NEXT_PUBLIC_BASE_PATH = originalBasePath;
    }
  });

  it('should redirect to /dashboard when no base path is configured', () => {
    delete process.env.NEXT_PUBLIC_BASE_PATH;

    HomePage();

    expect(mockRedirect).toHaveBeenCalledWith('/dashboard');
  });

  it('should redirect to the base-path-prefixed dashboard when a base path is configured', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/rezepte';

    HomePage();

    expect(mockRedirect).toHaveBeenCalledWith('/rezepte/dashboard');
  });
});
