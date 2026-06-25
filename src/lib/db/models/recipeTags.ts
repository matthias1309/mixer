import { DbClient } from '../init';

// Shared by RecipeModel and RecipeModelAsync (REQ-016): recipe_tags is an
// n:m relation, not a column, so both create/update paths replace the full
// tag set rather than merging it.
export function replaceRecipeTags(db: DbClient, recipeId: number, tags: string[]): void {
  db.prepare('DELETE FROM recipe_tags WHERE recipe_id = ?').run(recipeId);

  const insert = db.prepare('INSERT INTO recipe_tags (recipe_id, tag) VALUES (?, ?)');
  for (const tag of tags) {
    insert.run(recipeId, tag);
  }
}

export function getRecipeTags(db: DbClient, recipeId: number): string[] {
  const rows = db
    .prepare('SELECT tag FROM recipe_tags WHERE recipe_id = ? ORDER BY tag ASC')
    .all(recipeId) as { tag: string }[];
  return rows.map((row) => row.tag);
}

// Batch-fetches tags for a page of recipe ids. Used by the list/filter query
// methods on both RecipeModel and RecipeModelAsync, which fetch tags
// separately from their main paginated query rather than via a LEFT JOIN
// (a JOIN against this n:m table would multiply out their per-ingredient
// nutrient SUM aggregates).
export function getTagsForRecipeIds(db: DbClient, recipeIds: number[]): Map<number, string[]> {
  const tagsByRecipeId = new Map<number, string[]>();
  if (recipeIds.length === 0) {
    return tagsByRecipeId;
  }

  const placeholders = recipeIds.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT recipe_id, tag FROM recipe_tags WHERE recipe_id IN (${placeholders}) ORDER BY tag ASC`
    )
    .all(...recipeIds) as { recipe_id: number; tag: string }[];

  for (const row of rows) {
    const tags = tagsByRecipeId.get(row.recipe_id) || [];
    tags.push(row.tag);
    tagsByRecipeId.set(row.recipe_id, tags);
  }

  return tagsByRecipeId;
}
