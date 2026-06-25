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

export const RECIPE_SORT_OPTIONS = ['date', 'name', 'ingredients'] as const;
export type RecipeSortOption = (typeof RECIPE_SORT_OPTIONS)[number];

export const PHASE_OPTIONS = ['menstruation', 'follicular', 'ovulation', 'luteal'] as const;
export type PhaseOption = (typeof PHASE_OPTIONS)[number];

export const DEFAULT_PHASE = 'menstruation';
export const DEFAULT_RECIPE_SORT = 'date';

// REWE-style recipe metadata vocabulary (REQ-016) — single source of truth
// for validation, the recipe form, and the later filter UI (REQ-017).
export const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const;
export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number];

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'Geringer Aufwand',
  medium: 'Mittlerer Aufwand',
  hard: 'Hoher Aufwand',
};

export const MEAL_TYPES = [
  'Vorspeise',
  'Hauptspeise',
  'Dessert',
  'Beilagen',
  'Frühstück',
  'Suppen',
  'Auflauf',
  'Snacks',
  'Getränke',
] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const TAG_GROUPS = {
  ernaehrung: ['Fleisch', 'Fisch', 'Vegetarisch', 'Vegan'],
  hauptzutat: ['Nudeln/Pasta', 'Kartoffeln', 'Reis', 'Gemüse', 'Kürbis'],
  ernaehrungsform: [
    'Laktosefrei',
    'Low Carb',
    'Glutenfrei',
    'Paleo',
    'Wenig Zucker',
    'Clean Eating',
  ],
  backen: ['Kuchen', 'Torten', 'Brot', 'Muffins', 'Cupcakes', 'Plätzchen'],
  anlaesse: ['Frühling', 'Grillen', 'Picknick', 'Kindergerichte', 'Geburtstag', 'Party', 'günstig'],
} as const;

export const TAG_VOCABULARY: string[] = Object.values(TAG_GROUPS).flat();

export function isValidDifficulty(value: string): value is DifficultyLevel {
  return (DIFFICULTY_LEVELS as readonly string[]).includes(value);
}

export function isValidMealType(value: string): value is MealType {
  return (MEAL_TYPES as readonly string[]).includes(value);
}

export function isValidTag(value: string): boolean {
  return TAG_VOCABULARY.includes(value);
}

export const HTTP_STATUS = {
  OK: 200,
  NO_CONTENT: 204,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
