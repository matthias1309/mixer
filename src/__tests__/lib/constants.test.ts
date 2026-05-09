import { API_ROUTES, VALIDATION, HTTP_STATUS } from '@lib/constants';

describe('Constants', () => {
  describe('API_ROUTES', () => {
    it('should have auth routes defined', () => {
      expect(API_ROUTES.AUTH_LOGIN).toBe('/api/auth/login');
      expect(API_ROUTES.AUTH_REGISTER).toBe('/api/auth/register');
      expect(API_ROUTES.AUTH_LOGOUT).toBe('/api/auth/logout');
    });

    it('should have recipe routes defined', () => {
      expect(API_ROUTES.RECIPES).toBe('/api/recipes');
      expect(API_ROUTES.RECIPES_BY_ID('123')).toBe('/api/recipes/123');
    });

    it('should generate correct recipe ID route', () => {
      const recipeId = 'test-123';
      expect(API_ROUTES.RECIPES_BY_ID(recipeId)).toBe(`/api/recipes/${recipeId}`);
    });
  });

  describe('VALIDATION', () => {
    it('should have email regex pattern', () => {
      expect(VALIDATION.EMAIL_REGEX.test('test@example.com')).toBe(true);
      expect(VALIDATION.EMAIL_REGEX.test('invalid-email')).toBe(false);
    });

    it('should have password min length', () => {
      expect(VALIDATION.PASSWORD_MIN_LENGTH).toBe(8);
    });

    it('should have recipe constraints', () => {
      expect(VALIDATION.RECIPE_NAME_MAX_LENGTH).toBe(100);
      expect(VALIDATION.MAX_INGREDIENTS).toBe(50);
    });
  });

  describe('HTTP_STATUS', () => {
    it('should have standard HTTP status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });
});
