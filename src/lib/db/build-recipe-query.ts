// REWE-style filter & sort engine (REQ-017): translates the optional
// difficulty/maxTime/mealType/tags/sort filters into parameterised SQL
// predicates and an ORDER BY clause. Unknown values are dropped rather than
// erroring (AC-017-04) so a stray query param never produces a 500.
import { isValidDifficulty, isValidMealType, isValidTag } from '@/lib/constants';

export interface RecipeQueryFilters {
  difficulty?: string | null;
  maxTime?: number | null;
  mealType?: string | null;
  tags?: string[];
  sort?: string;
}

export interface BuiltRecipeQuery {
  predicates: string[];
  params: unknown[];
  orderBy: string;
}

const DEFAULT_ORDER_BY = 'recipes.created_at DESC';

// `rating` falls back to the default ordering until REQ-018 provides
// aggregated star ratings to sort by.
const ORDER_BY_MAP: Record<string, string> = {
  date: DEFAULT_ORDER_BY,
  newest: DEFAULT_ORDER_BY,
  rating: DEFAULT_ORDER_BY,
  name: 'recipes.name ASC',
  ingredients: 'COUNT(DISTINCT ingredients.id) ASC',
  time: 'recipes.total_time_minutes IS NULL, recipes.total_time_minutes ASC',
};

export function buildRecipeQuery(filters: RecipeQueryFilters = {}): BuiltRecipeQuery {
  const predicates: string[] = [];
  const params: unknown[] = [];

  if (filters.difficulty && isValidDifficulty(filters.difficulty)) {
    predicates.push('recipes.difficulty = ?');
    params.push(filters.difficulty);
  }

  if (filters.maxTime !== null && filters.maxTime !== undefined && filters.maxTime > 0) {
    predicates.push('recipes.total_time_minutes IS NOT NULL AND recipes.total_time_minutes <= ?');
    params.push(filters.maxTime);
  }

  if (filters.mealType && isValidMealType(filters.mealType)) {
    predicates.push('recipes.meal_type = ?');
    params.push(filters.mealType);
  }

  if (filters.tags && filters.tags.length > 0) {
    const knownTags = filters.tags.filter((tag) => isValidTag(tag));
    if (knownTags.length > 0) {
      const placeholders = knownTags.map(() => '?').join(',');
      predicates.push(
        `recipes.id IN (SELECT recipe_id FROM recipe_tags WHERE tag IN (${placeholders}) GROUP BY recipe_id HAVING COUNT(DISTINCT tag) = ?)`
      );
      params.push(...knownTags, knownTags.length);
    }
  }

  const orderBy = (filters.sort && ORDER_BY_MAP[filters.sort]) || DEFAULT_ORDER_BY;

  return { predicates, params, orderBy };
}
