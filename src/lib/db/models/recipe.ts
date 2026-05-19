import { getDatabase, isPostgres } from '../init';
import { Recipe, RecipeListItem, CreateIngredientRequest, Ingredient } from '@/types';
import { calculateScore, AggregatedNutrients } from '@/lib/scoring/phaseScore';
import Database from 'better-sqlite3';
import { Pool } from 'pg';

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

  static getNutrients(recipeId: number): Record<string, number> {
    const db = getDatabase();
    const stmt = db.prepare(`
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
        SUM(COALESCE(ingredients_master.sodium, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as sodium,
        SUM(COALESCE(ingredients_master.salt, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as salt
      FROM ingredients
      LEFT JOIN ingredients_master ON LOWER(TRIM(ingredients_master.name)) = LOWER(TRIM(ingredients.name))
      WHERE ingredients.recipe_id = ?
    `);

    const result = stmt.get(recipeId) as Record<string, number | null>;

    // Convert nulls to 0 and filter out null values
    const nutrients: Record<string, number> = {};
    for (const [key, value] of Object.entries(result)) {
      nutrients[key] = value || 0;
    }
    return nutrients;
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
    const rows = stmt.all(recipeId) as Ingredient[];
    return rows.map(row => ({
      ...row,
      quantity: Math.round(row.quantity)
    }));
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

  static listAllWithScore(
    page: number = 1,
    pageSize: number = 10,
    sortBy: 'date' | 'name' | 'ingredients' = 'date',
    search: string | undefined,
    phase: string = 'menstruation'
  ): { recipes: (RecipeListItem & { score: number | null })[]; total: number } {
    const db = getDatabase();

    const sortByMap: Record<string, string> = {
      'date': 'recipes.created_at DESC',
      'name': 'recipes.name ASC',
      'ingredients': 'COUNT(DISTINCT ingredients.id) ASC',
    };
    const orderBy = sortByMap[sortBy] || sortByMap['date'];

    const offset = (page - 1) * pageSize;
    const searchParam = search ? `%${search}%` : null;

    // Count total non-duplicate recipes matching search
    const countStmt = db.prepare(`
      SELECT COUNT(DISTINCT recipes.id) as total
      FROM recipes
      WHERE recipes.is_duplicate = 0
        AND (recipes.name LIKE ? OR ? IS NULL)
    `);
    const countResult = countStmt.get(searchParam, searchParam) as { total: number };

    // Get recipes with nutrient data from ingredients_master
    const stmt = db.prepare(`
      SELECT
        recipes.id,
        recipes.name,
        recipes.description,
        users.email as creatorName,
        COUNT(DISTINCT ingredients.id) as ingredientCount,
        recipes.created_at as createdAt,
        SUM(COALESCE(ingredients_master.iron, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_iron,
        SUM(COALESCE(ingredients_master.magnesium, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_magnesium,
        SUM(COALESCE(ingredients_master.protein, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_protein,
        SUM(COALESCE(ingredients_master.calcium, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_calcium,
        SUM(COALESCE(ingredients_master.vitamin_b6, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_vitamin_b6,
        SUM(COALESCE(ingredients_master.vitamin_b12, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_vitamin_b12,
        SUM(COALESCE(ingredients_master.vitamin_e, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_vitamin_e,
        SUM(COALESCE(ingredients_master.zinc, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_zinc,
        SUM(COALESCE(ingredients_master.fiber, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_fiber,
        SUM(COALESCE(ingredients_master.vitamin_d, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_vitamin_d,
        COUNT(CASE WHEN ingredients_master.id IS NOT NULL THEN 1 END) as matched_ingredients
      FROM recipes
      JOIN users ON recipes.creator_id = users.id
      LEFT JOIN ingredients ON recipes.id = ingredients.recipe_id
      LEFT JOIN ingredients_master ON LOWER(TRIM(ingredients_master.name)) = LOWER(TRIM(ingredients.name))
      WHERE recipes.is_duplicate = 0
        AND (recipes.name LIKE ? OR ? IS NULL)
      GROUP BY recipes.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(searchParam, searchParam, pageSize, offset) as any[];

    const recipes = rows.map((row: any) => {
      let score: number | null = null;

      if (row.matched_ingredients > 0) {
        const nutrients: AggregatedNutrients = {
          iron: row.total_iron || 0,
          magnesium: row.total_magnesium || 0,
          protein: row.total_protein || 0,
          calcium: row.total_calcium || 0,
          vitamin_b6: row.total_vitamin_b6 || 0,
          vitamin_b12: row.total_vitamin_b12 || 0,
          vitamin_e: row.total_vitamin_e || 0,
          zinc: row.total_zinc || 0,
          fiber: row.total_fiber || 0,
          vitamin_d: row.total_vitamin_d || 0,
        };
        score = calculateScore(nutrients, phase);
      }

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        creatorName: row.creatorName,
        ingredientCount: row.ingredientCount,
        createdAt: row.createdAt,
        score,
      };
    });

    return {
      recipes,
      total: countResult.total,
    };
  }

  static filterByIngredientsWithScore(
    ingredientNames: string[],
    page: number = 1,
    pageSize: number = 10,
    phase: string = 'menstruation'
  ) {
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
        COUNT(DISTINCT ingredients.id) as ingredientCount,
        recipes.created_at as createdAt,
        SUM(COALESCE(ingredients_master.iron, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_iron,
        SUM(COALESCE(ingredients_master.magnesium, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_magnesium,
        SUM(COALESCE(ingredients_master.protein, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_protein,
        SUM(COALESCE(ingredients_master.calcium, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_calcium,
        SUM(COALESCE(ingredients_master.vitamin_b6, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_vitamin_b6,
        SUM(COALESCE(ingredients_master.vitamin_b12, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_vitamin_b12,
        SUM(COALESCE(ingredients_master.vitamin_e, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_vitamin_e,
        SUM(COALESCE(ingredients_master.zinc, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_zinc,
        SUM(COALESCE(ingredients_master.fiber, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_fiber,
        SUM(COALESCE(ingredients_master.vitamin_d, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_vitamin_d,
        COUNT(CASE WHEN ingredients_master.id IS NOT NULL THEN 1 END) as matched_ingredients
      FROM recipes
      JOIN users ON recipes.creator_id = users.id
      LEFT JOIN ingredients ON recipes.id = ingredients.recipe_id
      LEFT JOIN ingredients_master ON LOWER(TRIM(ingredients_master.name)) = LOWER(TRIM(ingredients.name))
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

    const rows = stmt.all(
      ...normalizedIngredients,
      normalizedIngredients.length,
      pageSize,
      offset
    ) as any[];

    const recipes = rows.map((row: any) => {
      let score: number | null = null;

      if (row.matched_ingredients > 0) {
        const nutrients: AggregatedNutrients = {
          iron: row.total_iron || 0,
          magnesium: row.total_magnesium || 0,
          protein: row.total_protein || 0,
          calcium: row.total_calcium || 0,
          vitamin_b6: row.total_vitamin_b6 || 0,
          vitamin_b12: row.total_vitamin_b12 || 0,
          vitamin_e: row.total_vitamin_e || 0,
          zinc: row.total_zinc || 0,
          fiber: row.total_fiber || 0,
          vitamin_d: row.total_vitamin_d || 0,
        };
        score = calculateScore(nutrients, phase);
      }

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        creatorName: row.creatorName,
        ingredientCount: row.ingredientCount,
        createdAt: row.createdAt,
        score,
      };
    });

    return {
      recipes,
      total: countResult.total,
    };
  }

  static async filterByIngredientsWithScoreAsync(
    ingredientNames: string[],
    page: number = 1,
    pageSize: number = 10,
    phase: string = 'menstruation'
  ): Promise<{ recipes: RecipeListItem[]; total: number }> {
    const db = getDatabase();
    const normalizedIngredients = ingredientNames.map(i => i.trim().toLowerCase());
    const offset = (page - 1) * pageSize;

    if (isPostgres()) {
      const pool = db as Pool;

      const countResult = await pool.query(`
        SELECT COUNT(DISTINCT recipes.id) as total
        FROM recipes
        WHERE recipes.is_duplicate = false
          AND recipes.id IN (
            SELECT recipe_id
            FROM ingredients
            WHERE LOWER(TRIM(name)) = ANY($1)
            GROUP BY recipe_id
            HAVING COUNT(DISTINCT LOWER(TRIM(name))) = $2
          )
      `, [normalizedIngredients, normalizedIngredients.length]);

      const recipesResult = await pool.query(`
        SELECT
          recipes.id,
          recipes.name,
          recipes.description,
          users.email as "creatorName",
          COUNT(DISTINCT ingredients.id) as "ingredientCount",
          recipes.created_at as "createdAt",
          SUM(COALESCE(ingredients_master.iron, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_iron,
          SUM(COALESCE(ingredients_master.magnesium, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_magnesium,
          SUM(COALESCE(ingredients_master.protein, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_protein,
          SUM(COALESCE(ingredients_master.calcium, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_calcium,
          SUM(COALESCE(ingredients_master.vitamin_b6, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_vitamin_b6,
          SUM(COALESCE(ingredients_master.vitamin_b12, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_vitamin_b12,
          SUM(COALESCE(ingredients_master.vitamin_e, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_vitamin_e,
          SUM(COALESCE(ingredients_master.zinc, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_zinc,
          SUM(COALESCE(ingredients_master.fiber, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_fiber,
          SUM(COALESCE(ingredients_master.vitamin_d, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as total_vitamin_d,
          COUNT(CASE WHEN ingredients_master.id IS NOT NULL THEN 1 END) as matched_ingredients
        FROM recipes
        JOIN users ON recipes.creator_id = users.id
        LEFT JOIN ingredients ON recipes.id = ingredients.recipe_id
        LEFT JOIN ingredients_master ON LOWER(TRIM(ingredients_master.name)) = LOWER(TRIM(ingredients.name))
        WHERE recipes.is_duplicate = false
          AND recipes.id IN (
            SELECT recipe_id
            FROM ingredients
            WHERE LOWER(TRIM(name)) = ANY($1)
            GROUP BY recipe_id
            HAVING COUNT(DISTINCT LOWER(TRIM(name))) = $2
          )
        GROUP BY recipes.id, recipes.name, recipes.description, recipes.created_at, users.email
        ORDER BY recipes.created_at DESC
        LIMIT $3 OFFSET $4
      `, [normalizedIngredients, normalizedIngredients.length, pageSize, offset]);

      const recipes: any[] = recipesResult.rows.map((row: any) => {
        let score: number | null = null;

        if (row.matched_ingredients > 0) {
          const nutrients: AggregatedNutrients = {
            iron: parseFloat(row.total_iron) || 0,
            magnesium: parseFloat(row.total_magnesium) || 0,
            protein: parseFloat(row.total_protein) || 0,
            calcium: parseFloat(row.total_calcium) || 0,
            vitamin_b6: parseFloat(row.total_vitamin_b6) || 0,
            vitamin_b12: parseFloat(row.total_vitamin_b12) || 0,
            vitamin_e: parseFloat(row.total_vitamin_e) || 0,
            zinc: parseFloat(row.total_zinc) || 0,
            fiber: parseFloat(row.total_fiber) || 0,
            vitamin_d: parseFloat(row.total_vitamin_d) || 0,
          };
          score = calculateScore(nutrients, phase);
        }

        return {
          id: row.id,
          name: row.name,
          description: row.description,
          creatorName: row.creatorName,
          ingredientCount: parseInt(row.ingredientCount, 10),
          createdAt: row.createdAt,
          score,
        };
      });

      return {
        recipes,
        total: parseInt(countResult.rows[0].total, 10),
      };
    } else {
      // SQLite: use the synchronous method
      return this.filterByIngredientsWithScore(ingredientNames, page, pageSize, phase);
    }
  }
}
