import { getDb, isPostgres } from '../init';
import { Recipe, CreateIngredientRequest, Ingredient } from '@/types';
import { Pool } from 'pg';
import Database from 'better-sqlite3';

export class RecipeModelAsync {
  static async create(
    name: string,
    creatorId: number,
    description?: string,
    instructions?: string,
    servings?: number,
    ingredients?: CreateIngredientRequest[],
    canonicalId?: number | null
  ): Promise<Recipe> {
    const db = getDb();
    const isDuplicate = canonicalId !== null && canonicalId !== undefined;

    if (isPostgres()) {
      const pool = db as Pool;
      const result = await pool.query(
        `INSERT INTO recipes (name, description, instructions, servings, creator_id, canonical_id, is_duplicate)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [name, description || null, instructions || null, servings || 1, creatorId, canonicalId || null, isDuplicate]
      );
      const recipeId = result.rows[0].id;

      if (ingredients && ingredients.length > 0) {
        for (const ing of ingredients) {
          await pool.query(
            `INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES ($1, $2, $3, $4)`,
            [recipeId, ing.name.trim().toLowerCase(), ing.quantity, ing.unit || null]
          );
        }
      }

      return (await this.findById(recipeId))!;
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare(
        `INSERT INTO recipes (name, description, instructions, servings, creator_id, canonical_id, is_duplicate)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );

      const info = stmt.run(
        name,
        description || null,
        instructions || null,
        servings || 1,
        creatorId,
        canonicalId || null,
        isDuplicate ? 1 : 0
      ) as { lastInsertRowid: number };

      const recipeId = Number(info.lastInsertRowid);

      if (ingredients && ingredients.length > 0) {
        const ingredientStmt = sqlite.prepare(
          `INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?)`
        );

        for (const ing of ingredients) {
          ingredientStmt.run(
            recipeId,
            ing.name.trim().toLowerCase(),
            ing.quantity,
            ing.unit || null
          );
        }
      }

      return (await this.findById(recipeId))!;
    }
  }

  static async findById(id: number): Promise<Recipe | null> {
    const db = getDb();

    if (isPostgres()) {
      const pool = db as Pool;
      const result = await pool.query('SELECT * FROM recipes WHERE id = $1', [id]);
      return (result.rows[0] as Recipe) || null;
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare('SELECT * FROM recipes WHERE id = ?');
      return (stmt.get(id) as Recipe) || null;
    }
  }

  static async findByNameAndIngredients(name: string, ingredientNames: string[]): Promise<Recipe | null> {
    const db = getDb();
    const normalizedName = name.trim().toLowerCase();
    const normalizedIngredients = ingredientNames.map(i => i.trim().toLowerCase()).sort();

    if (isPostgres()) {
      const pool = db as Pool;
      const result = await pool.query(
        'SELECT id FROM recipes WHERE LOWER(name) = $1 AND is_duplicate = false',
        [normalizedName]
      );

      for (const candidate of result.rows) {
        const recipe = await this.findById(candidate.id);
        if (!recipe) continue;

        const ingsResult = await pool.query(
          'SELECT name FROM ingredients WHERE recipe_id = $1 ORDER BY name ASC',
          [recipe.id]
        );
        const recipeIngs = ingsResult.rows.map((i: any) => i.name).sort();

        if (recipeIngs.length === normalizedIngredients.length &&
            recipeIngs.every((val, idx) => val === normalizedIngredients[idx])) {
          return recipe;
        }
      }
    } else {
      const sqlite = db as Database.Database;
      const candidates = sqlite
        .prepare('SELECT id FROM recipes WHERE LOWER(name) = ? AND is_duplicate = 0')
        .all(normalizedName) as { id: number }[];

      for (const candidate of candidates) {
        const recipe = await this.findById(candidate.id);
        if (!recipe) continue;

        const recipeIngs = sqlite
          .prepare('SELECT name FROM ingredients WHERE recipe_id = ? ORDER BY name ASC')
          .all(recipe.id) as { name: string }[];

        const ingNames = recipeIngs.map(i => i.name).sort();
        if (ingNames.length === normalizedIngredients.length &&
            ingNames.every((val, idx) => val === normalizedIngredients[idx])) {
          return recipe;
        }
      }
    }

    return null;
  }

  static async getIngredients(recipeId: number): Promise<Ingredient[]> {
    const db = getDb();

    if (isPostgres()) {
      const pool = db as Pool;
      const result = await pool.query(
        'SELECT * FROM ingredients WHERE recipe_id = $1 ORDER BY name ASC',
        [recipeId]
      );
      return result.rows as Ingredient[];
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY name ASC');
      return stmt.all(recipeId) as Ingredient[];
    }
  }
}
