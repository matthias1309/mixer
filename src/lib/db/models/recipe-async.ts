import { getDb, isPostgres } from '../init';
import { Recipe, CreateIngredientRequest, Ingredient, RecipeListItem } from '@/types';
import { Pool } from 'pg';
import Database from 'better-sqlite3';

import { calculateScore, AggregatedNutrients } from '@/lib/scoring/phaseScore';

export type RecipeListItemWithScore = RecipeListItem & { score?: number | null };

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

  static async listAll(
    page: number = 1,
    pageSize: number = 10,
    sortBy: 'date' | 'name' | 'ingredients' = 'date',
    search?: string
  ): Promise<{ recipes: any[]; total: number }> {
    const db = getDb();

    const sortByMap: Record<string, string> = {
      'date': 'recipes.created_at DESC',
      'name': 'recipes.name ASC',
      'ingredients': 'COUNT(ingredients.id) ASC',
    };
    const orderBy = sortByMap[sortBy] || sortByMap['date'];
    const offset = (page - 1) * pageSize;
    const searchParam = search ? `%${search}%` : null;

    if (isPostgres()) {
      const pool = db as Pool;

      const countResult = await pool.query(
        `SELECT COUNT(DISTINCT recipes.id) as total
         FROM recipes
         WHERE recipes.is_duplicate = false
           AND (recipes.name LIKE $1 OR $2 IS NULL)`,
        [searchParam, searchParam]
      );

      const recipesResult = await pool.query(
        `SELECT
          recipes.id,
          recipes.name,
          recipes.description,
          users.email as "creatorName",
          COUNT(ingredients.id) as "ingredientCount",
          recipes.created_at as "createdAt"
         FROM recipes
         JOIN users ON recipes.creator_id = users.id
         LEFT JOIN ingredients ON recipes.id = ingredients.recipe_id
         WHERE recipes.is_duplicate = false
           AND (recipes.name LIKE $1 OR $2 IS NULL)
         GROUP BY recipes.id
         ORDER BY ${orderBy}
         LIMIT $3 OFFSET $4`,
        [searchParam, searchParam, pageSize, offset]
      );

      return {
        recipes: recipesResult.rows,
        total: parseInt(countResult.rows[0].total, 10),
      };
    } else {
      const sqlite = db as Database.Database;
      const countStmt = sqlite.prepare(
        `SELECT COUNT(DISTINCT recipes.id) as total
         FROM recipes
         WHERE recipes.is_duplicate = 0
           AND (recipes.name LIKE ? OR ? IS NULL)`
      );

      const countResult = countStmt.get(searchParam, searchParam) as { total: number };

      const stmt = sqlite.prepare(
        `SELECT
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
         LIMIT ? OFFSET ?`
      );

      const recipes = stmt.all(searchParam, searchParam, pageSize, offset) as any[];

      return {
        recipes,
        total: countResult.total,
      };
    }
  }

  static async getNutrients(recipeId: number): Promise<Record<string, number>> {
    const db = getDb();

    if (isPostgres()) {
      const pool = db as Pool;
      const result = await pool.query(
        `SELECT
          SUM(COALESCE(ingredients_master.kcal, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as kcal,
          SUM(COALESCE(ingredients_master.iron, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as iron,
          SUM(COALESCE(ingredients_master.magnesium, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as magnesium,
          SUM(COALESCE(ingredients_master.protein, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as protein,
          SUM(COALESCE(ingredients_master.calcium, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as calcium,
          SUM(COALESCE(ingredients_master.vitamin_b6, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as vitamin_b6,
          SUM(COALESCE(ingredients_master.vitamin_b12, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as vitamin_b12,
          SUM(COALESCE(ingredients_master.vitamin_e, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as vitamin_e,
          SUM(COALESCE(ingredients_master.zinc, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as zinc,
          SUM(COALESCE(ingredients_master.fiber, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as fiber,
          SUM(COALESCE(ingredients_master.vitamin_d, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as vitamin_d,
          SUM(COALESCE(ingredients_master.sugar, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as sugar,
          SUM(COALESCE(ingredients_master.fat, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as fat,
          SUM(COALESCE(ingredients_master.carbohydrates, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as carbohydrates,
          SUM(COALESCE(ingredients_master.sodium, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as sodium
         FROM ingredients
         LEFT JOIN ingredients_master ON LOWER(TRIM(ingredients_master.name)) = LOWER(TRIM(ingredients.name))
         WHERE ingredients.recipe_id = $1`,
        [recipeId]
      );
      const row = result.rows[0] || {};
      const nutrients: Record<string, number> = {};
      for (const [key, value] of Object.entries(row)) {
        nutrients[key] = (value as number) || 0;
      }
      return nutrients;
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare(`
        SELECT
          SUM(COALESCE(ingredients_master.kcal, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as kcal,
          SUM(COALESCE(ingredients_master.iron, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as iron,
          SUM(COALESCE(ingredients_master.magnesium, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as magnesium,
          SUM(COALESCE(ingredients_master.protein, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as protein,
          SUM(COALESCE(ingredients_master.calcium, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as calcium,
          SUM(COALESCE(ingredients_master.vitamin_b6, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as vitamin_b6,
          SUM(COALESCE(ingredients_master.vitamin_b12, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as vitamin_b12,
          SUM(COALESCE(ingredients_master.vitamin_e, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as vitamin_e,
          SUM(COALESCE(ingredients_master.zinc, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as zinc,
          SUM(COALESCE(ingredients_master.fiber, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as fiber,
          SUM(COALESCE(ingredients_master.vitamin_d, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as vitamin_d,
          SUM(COALESCE(ingredients_master.sugar, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as sugar,
          SUM(COALESCE(ingredients_master.fat, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as fat,
          SUM(COALESCE(ingredients_master.carbohydrates, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as carbohydrates,
          SUM(COALESCE(ingredients_master.sodium, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as sodium
        FROM ingredients
        LEFT JOIN ingredients_master ON LOWER(TRIM(ingredients_master.name)) = LOWER(TRIM(ingredients.name))
        WHERE ingredients.recipe_id = ?
      `);
      const result = stmt.get(recipeId) as Record<string, number | null>;
      const nutrients: Record<string, number> = {};
      for (const [key, value] of Object.entries(result)) {
        nutrients[key] = value || 0;
      }
      return nutrients;
    }
  }

  static async update(
    id: number,
    name?: string,
    description?: string,
    instructions?: string,
    servings?: number,
    ingredients?: CreateIngredientRequest[]
  ): Promise<Recipe> {
    const db = getDb();

    if (isPostgres()) {
      const pool = db as Pool;
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }
      if (description !== undefined) {
        updates.push(`description = $${paramIndex++}`);
        values.push(description || null);
      }
      if (instructions !== undefined) {
        updates.push(`instructions = $${paramIndex++}`);
        values.push(instructions || null);
      }
      if (servings !== undefined) {
        updates.push(`servings = $${paramIndex++}`);
        values.push(servings);
      }

      updates.push(`updated_at = $${paramIndex++}`);
      values.push(new Date().toISOString());
      values.push(id);

      if (updates.length > 1) {
        await pool.query(
          `UPDATE recipes SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }

      if (ingredients !== undefined) {
        await pool.query('DELETE FROM ingredients WHERE recipe_id = $1', [id]);

        for (const ing of ingredients) {
          await pool.query(
            `INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES ($1, $2, $3, $4)`,
            [id, ing.name.trim().toLowerCase(), ing.quantity, ing.unit || null]
          );
        }
      }

      return (await this.findById(id))!;
    } else {
      const sqlite = db as Database.Database;
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
        const stmt = sqlite.prepare(`
          UPDATE recipes
          SET ${updates.join(', ')}, updated_at = ?
          WHERE id = ?
        `);
        stmt.run(...values);
      }

      if (ingredients !== undefined) {
        sqlite.prepare('DELETE FROM ingredients WHERE recipe_id = ?').run(id);

        for (const ing of ingredients) {
          sqlite.prepare(`
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

      return (await this.findById(id))!;
    }
  }

  static async delete(id: number): Promise<void> {
    const db = getDb();

    if (isPostgres()) {
      const pool = db as Pool;
      await pool.query('DELETE FROM recipes WHERE id = $1', [id]);
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare('DELETE FROM recipes WHERE id = ?');
      stmt.run(id);
    }
  }

  static async getUniqueIngredients(): Promise<string[]> {
    const db = getDb();

    if (isPostgres()) {
      const pool = db as Pool;
      const result = await pool.query(`
        SELECT DISTINCT LOWER(TRIM(name)) as name
        FROM ingredients
        WHERE recipe_id IN (
          SELECT id FROM recipes WHERE is_duplicate = false
        )
        ORDER BY name ASC
      `);
      return result.rows.map((row: any) => row.name);
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare(`
        SELECT DISTINCT LOWER(TRIM(name)) as name
        FROM ingredients
        WHERE recipe_id IN (
          SELECT id FROM recipes WHERE is_duplicate = 0
        )
        ORDER BY name ASC
      `);
      return (stmt.all() as { name: string }[]).map(i => i.name);
    }
  }
}
