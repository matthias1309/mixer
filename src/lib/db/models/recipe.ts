import { getDatabase } from '../init';
import { Recipe, RecipeListItem, CreateIngredientRequest, Ingredient } from '@/types';

export class RecipeModel {
  static create(
    name: string,
    creatorId: number,
    description?: string,
    instructions?: string,
    servings?: number,
    ingredients?: CreateIngredientRequest[],
    canonicalId?: number | null
  ): Recipe {
    const db = getDatabase();

    const stmt = db.prepare(`
      INSERT INTO recipes (name, description, instructions, servings, creator_id, canonical_id, is_duplicate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const isDuplicate = canonicalId !== null && canonicalId !== undefined ? 1 : 0;
    const info = stmt.run(
      name,
      description || null,
      instructions || null,
      servings || 1,
      creatorId,
      canonicalId || null,
      isDuplicate
    ) as { lastInsertRowid: number };

    const recipeId = Number(info.lastInsertRowid);

    // Add ingredients if provided
    if (ingredients && ingredients.length > 0) {
      const ingredientStmt = db.prepare(`
        INSERT INTO ingredients (recipe_id, name, quantity, unit)
        VALUES (?, ?, ?, ?)
      `);

      for (const ing of ingredients) {
        ingredientStmt.run(
          recipeId,
          ing.name.trim().toLowerCase(),
          ing.quantity,
          ing.unit || null
        );
      }
    }

    return this.findById(recipeId)!;
  }

  static findById(id: number): Recipe | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM recipes WHERE id = ?');
    return (stmt.get(id) as Recipe) || null;
  }

  static listAll(
    page: number = 1,
    pageSize: number = 10,
    sortBy: 'date' | 'name' | 'ingredients' = 'date',
    search?: string
  ): { recipes: RecipeListItem[]; total: number } {
    const db = getDatabase();

    // Safe mapping of sort parameter
    const sortByMap: Record<string, string> = {
      'date': 'recipes.created_at DESC',
      'name': 'recipes.name ASC',
      'ingredients': 'COUNT(ingredients.id) ASC',
    };
    const orderBy = sortByMap[sortBy] || sortByMap['date'];

    const offset = (page - 1) * pageSize;

    const countStmt = db.prepare(`
      SELECT COUNT(DISTINCT recipes.id) as total
      FROM recipes
      WHERE recipes.is_duplicate = 0
        AND (recipes.name LIKE ? OR ? IS NULL)
    `);

    const searchParam = search ? `%${search}%` : null;
    const countResult = countStmt.get(searchParam, searchParam) as { total: number };

    const stmt = db.prepare(`
      SELECT
        recipes.id,
        recipes.name,
        recipes.description,
        users.email as creatorName,
        COUNT(ingredients.id) as ingredientCount,
        recipes.created_at as createdAt
      FROM recipes
      JOIN users ON recipes.creator_id = users.id
      LEFT JOIN ingredients ON recipes.id = ingredients.recipe_id
      WHERE recipes.is_duplicate = 0
        AND (recipes.name LIKE ? OR ? IS NULL)
      GROUP BY recipes.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `);

    const recipes = stmt.all(searchParam, searchParam, pageSize, offset) as RecipeListItem[];

    return {
      recipes,
      total: countResult.total,
    };
  }

  static findByNameAndIngredients(name: string, ingredientNames: string[]): Recipe | null {
    const db = getDatabase();

    // Normalize for comparison
    const normalizedName = name.trim().toLowerCase();
    const normalizedIngredients = ingredientNames.map(i => i.trim().toLowerCase()).sort();

    // Find recipes with same name (and not duplicates)
    const candidates = db
      .prepare('SELECT id FROM recipes WHERE LOWER(name) = ? AND is_duplicate = 0')
      .all(normalizedName) as { id: number }[];

    for (const candidate of candidates) {
      const recipe = this.findById(candidate.id);
      if (!recipe) continue;

      const recipeIngs = this.getIngredients(recipe.id)
        .map(i => i.name)
        .sort();

      // Direct array comparison (arrays are sorted)
      if (recipeIngs.length === normalizedIngredients.length &&
          recipeIngs.every((val, idx) => val === normalizedIngredients[idx])) {
        return recipe;
      }
    }

    return null;
  }

  static update(
    id: number,
    name?: string,
    description?: string,
    instructions?: string,
    servings?: number,
    ingredients?: CreateIngredientRequest[]
  ): Recipe {
    const db = getDatabase();

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description || null);
    }
    if (instructions !== undefined) {
      updates.push('instructions = ?');
      values.push(instructions || null);
    }
    if (servings !== undefined) {
      updates.push('servings = ?');
      values.push(servings);
    }

    values.push(new Date().toISOString());
    values.push(id);

    if (updates.length > 0) {
      const stmt = db.prepare(`
        UPDATE recipes
        SET ${updates.join(', ')}, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(...values);
    }

    // Update ingredients if provided
    if (ingredients !== undefined) {
      db.prepare('DELETE FROM ingredients WHERE recipe_id = ?').run(id);

      for (const ing of ingredients) {
        db.prepare(`
          INSERT INTO ingredients (recipe_id, name, quantity, unit)
          VALUES (?, ?, ?, ?)
        `).run(
          id,
          ing.name.trim().toLowerCase(),
          ing.quantity,
          ing.unit || null
        );
      }
    }

    return this.findById(id)!;
  }

  static delete(id: number): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM recipes WHERE id = ?');
    stmt.run(id);
  }

  static getIngredients(recipeId: number): Ingredient[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY name ASC');
    return stmt.all(recipeId) as Ingredient[];
  }

  static getUniqueIngredients(): string[] {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT DISTINCT LOWER(TRIM(name)) as name
      FROM ingredients
      WHERE recipe_id IN (
        SELECT id FROM recipes WHERE is_duplicate = 0
      )
      ORDER BY name ASC
    `);

    return (stmt.all() as { name: string }[]).map(i => i.name);
  }

  static filterByIngredients(ingredientNames: string[], page: number = 1, pageSize: number = 10) {
    const db = getDatabase();

    const normalizedIngredients = ingredientNames.map(i => i.trim().toLowerCase());
    const placeholders = normalizedIngredients.map(() => '?').join(',');

    const offset = (page - 1) * pageSize;

    const countStmt = db.prepare(`
      SELECT COUNT(DISTINCT recipes.id) as total
      FROM recipes
      WHERE recipes.is_duplicate = 0
        AND recipes.id IN (
          SELECT recipe_id
          FROM ingredients
          WHERE LOWER(TRIM(name)) IN (${placeholders})
          GROUP BY recipe_id
          HAVING COUNT(DISTINCT LOWER(TRIM(name))) = ?
        )
    `);

    const countResult = countStmt.get(...normalizedIngredients, normalizedIngredients.length) as { total: number };

    const stmt = db.prepare(`
      SELECT
        recipes.id,
        recipes.name,
        recipes.description,
        users.email as creatorName,
        COUNT(ingredients.id) as ingredientCount,
        recipes.created_at as createdAt
      FROM recipes
      JOIN users ON recipes.creator_id = users.id
      LEFT JOIN ingredients ON recipes.id = ingredients.recipe_id
      WHERE recipes.is_duplicate = 0
        AND recipes.id IN (
          SELECT recipe_id
          FROM ingredients
          WHERE LOWER(TRIM(name)) IN (${placeholders})
          GROUP BY recipe_id
          HAVING COUNT(DISTINCT LOWER(TRIM(name))) = ?
        )
      GROUP BY recipes.id
      ORDER BY recipes.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const recipes = stmt.all(
      ...normalizedIngredients,
      normalizedIngredients.length,
      pageSize,
      offset
    ) as RecipeListItem[];

    return {
      recipes,
      total: countResult.total,
    };
  }
}
