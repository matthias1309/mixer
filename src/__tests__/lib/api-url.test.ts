import { apiUrl } from '@lib/api-url';

// TC-MAINT-003-01: base-path aware URL helper
describe('apiUrl', () => {
  const originalBasePath = process.env.NEXT_PUBLIC_BASE_PATH;

  afterEach(() => {
    if (originalBasePath === undefined) {
      delete process.env.NEXT_PUBLIC_BASE_PATH;
    } else {
      process.env.NEXT_PUBLIC_BASE_PATH = originalBasePath;
    }
  });

  it('should return the path unchanged when no base path is configured', () => {
    delete process.env.NEXT_PUBLIC_BASE_PATH;

    expect(apiUrl('/api/recipes')).toBe('/api/recipes');
  });

  it('should treat an empty base path as root', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '';

    expect(apiUrl('/api/users/cycle')).toBe('/api/users/cycle');
  });

  it('should prefix the configured base path', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/rezepte';

    expect(apiUrl('/api/recipes')).toBe('/rezepte/api/recipes');
  });

  it('should add a leading slash to a path that lacks one', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/rezepte';

    expect(apiUrl('api/recipes')).toBe('/rezepte/api/recipes');
  });

  it('should preserve query strings on the path', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/rezepte';

    expect(apiUrl('/api/ingredients-master?search=egg')).toBe(
      '/rezepte/api/ingredients-master?search=egg'
    );
  });
});
