// Application constants

export const API_ROUTES = {
  // Auth
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGOUT: '/api/auth/logout',

  // Users
  USER_PROFILE: '/api/users/profile',

  // Recipes
  RECIPES: '/api/recipes',
  RECIPES_BY_ID: (id: string) => `/api/recipes/${id}`,
  RECIPES_INGREDIENTS: '/api/recipes/ingredients',

  // Health
  HEALTH: '/api/health',
};

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  RECIPE_NAME_MAX_LENGTH: 100,
  RECIPE_DESCRIPTION_MAX_LENGTH: 500,
  RECIPE_INSTRUCTIONS_MAX_LENGTH: 2000,
  INGREDIENT_NAME_MAX_LENGTH: 100,
  MAX_INGREDIENTS: 50,
};

export const JWT = {
  EXPIRATION: process.env.JWT_EXPIRATION || '24h',
};

export const BCRYPT = {
  COST_FACTOR: 10,
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
