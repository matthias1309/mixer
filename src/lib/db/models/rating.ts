import { DbClient } from '../init';

export interface RatingAggregate {
  ratingAverage: number | null;
  ratingCount: number;
}

// Reused by recipe.ts/recipe-async.ts list & filter queries so the per-page
// average/count is joined in a single round trip rather than N+1 lookups.
// A LEFT JOIN (not a JOIN) so unrated recipes still appear, with NULL
// avg_rating/rating_count that callers COALESCE as needed (AC-018-06).
export const RATING_AGGREGATE_JOIN = `
  LEFT JOIN (
    SELECT recipe_id, ROUND(AVG(stars), 1) as avg_rating, COUNT(*) as rating_count
    FROM recipe_ratings
    GROUP BY recipe_id
  ) rr ON rr.recipe_id = recipes.id
`;

// The composite PK on recipe_ratings(user_id, recipe_id) enforces one rating
// per user/recipe at the DB level, so a re-rating is an upsert rather than a
// second INSERT (AC-018-02, AC-018-05).
export function upsertRating(db: DbClient, userId: number, recipeId: number, stars: number): void {
  db.prepare(
    `INSERT INTO recipe_ratings (user_id, recipe_id, stars)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, recipe_id) DO UPDATE SET stars = excluded.stars, updated_at = CURRENT_TIMESTAMP`
  ).run(userId, recipeId, stars);
}

export function getUserRating(db: DbClient, userId: number, recipeId: number): number | null {
  const row = db
    .prepare('SELECT stars FROM recipe_ratings WHERE user_id = ? AND recipe_id = ?')
    .get(userId, recipeId) as { stars: number } | undefined;
  return row ? row.stars : null;
}

// AC-018-06: average rounded to one decimal; null/0 for an unrated recipe.
export function getRatingAggregate(db: DbClient, recipeId: number): RatingAggregate {
  const row = db
    .prepare(
      `SELECT ROUND(AVG(stars), 1) as avg_rating, COUNT(*) as rating_count
       FROM recipe_ratings WHERE recipe_id = ?`
    )
    .get(recipeId) as { avg_rating: number | null; rating_count: number };

  return {
    ratingAverage: row.avg_rating,
    ratingCount: row.rating_count,
  };
}
