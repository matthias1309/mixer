import { getDb } from '../init';
import {
  Recipe,
  CreateIngredientRequest,
  Ingredient,
  RecipeListItem,
  RecipeMetadataInput,
} from '@/types';

import { calculateScore, AggregatedNutrients } from '@/lib/scoring/phaseScore';
import { replaceRecipeTags, getRecipeTags, getTagsForRecipeIds } from './recipeTags';
import { buildRecipeQuery, RecipeQueryFilters } from '@/lib/db/build-recipe-query';
import { RATING_AGGREGATE_JOIN } from './rating';
import { CREATOR_NAME_SQL } from '@/lib/users/display-name';

export type RecipeListItemWithScore = RecipeListItem & { score?: number | null };

export class RecipeModelAsync {
  static async create(
    name: string,
    creatorId: number,
    description?: string,
    instructions?: string,
    servings?: number,
    ingredients?: CreateIngredientRequest[],
    canonicalId?: number | null,
    metadata?: RecipeMetadataInput
  ): Promise<Recipe> {
    const db = getDb();
    const isDuplicate = canonicalId !== null && canonicalId !== undefined;

    const stmt = db.prepare(
      `INSERT INTO recipes
        (name, description, instructions, servings, creator_id, canonical_id, is_duplicate,
         difficulty, total_time_minutes, meal_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const info = stmt.run(
      name,
      description || null,
      instructions || null,
      servings || 1,
      creatorId,
      canonicalId || null,
      isDuplicate ? 1 : 0,
      metadata?.difficulty || null,
      metadata?.totalTimeMinutes || null,
      metadata?.mealType || null
    ) as { lastInsertRowid: number };

    const recipeId = Number(info.lastInsertRowid);

    if (ingredients && ingredients.length > 0) {
      const ingredientStmt = db.prepare(
        `INSERT INTO ingredients (recipe_id, name, quantity, unit) VALUES (?, ?, ?, ?)`
      );

      for (const ing of ingredients) {
        ingredientStmt.run(recipeId, ing.name.trim().toLowerCase(), ing.quantity, ing.unit || null);
      }
    }

    if (metadata?.tags) {
      replaceRecipeTags(db, recipeId, metadata.tags);
    }

    return (await this.findById(recipeId))!;
  }

  static async getTags(recipeId: number): Promise<string[]> {
    return getRecipeTags(getDb(), recipeId);
  }

  static async findById(id: number): Promise<Recipe | null> {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM recipes WHERE id = ?');
    return (stmt.get(id) as Recipe) || null;
  }

  static async findByNameAndIngredients(
    name: string,
    ingredientNames: string[]
  ): Promise<Recipe | null> {
    const db = getDb();
    const normalizedName = name.trim().toLowerCase();
    const normalizedIngredients = ingredientNames.map((i) => i.trim().toLowerCase()).sort();

    const candidates = db
      .prepare('SELECT id FROM recipes WHERE LOWER(name) = ? AND is_duplicate = 0')
      .all(normalizedName) as { id: number }[];

    for (const candidate of candidates) {
      const recipe = await this.findById(candidate.id);
      if (!recipe) continue;

      const recipeIngs = db
        .prepare('SELECT name FROM ingredients WHERE recipe_id = ? ORDER BY name ASC')
        .all(recipe.id) as { name: string }[];

      const ingNames = recipeIngs.map((i) => i.name).sort();
      if (
        ingNames.length === normalizedIngredients.length &&
        ingNames.every((val, idx) => val === normalizedIngredients[idx])
      ) {
        return recipe;
      }
    }

    return null;
  }

  static async getIngredients(recipeId: number): Promise<Ingredient[]> {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY name ASC');
    const rows = stmt.all(recipeId) as Ingredient[];
    return rows.map((row) => ({
      ...row,
      quantity: Math.round(row.quantity),
    }));
  }

  static async listAll(
    page: number = 1,
    pageSize: number = 10,
    sortBy: 'date' | 'name' | 'ingredients' = 'date',
    search?: string
  ): Promise<{ recipes: any[]; total: number }> {
    const db = getDb();

    const sortByMap: Record<string, string> = {
      date: 'recipes.created_at DESC',
      name: 'recipes.name ASC',
      ingredients: 'COUNT(ingredients.id) ASC',
    };
    const orderBy = sortByMap[sortBy] || sortByMap['date'];
    const offset = (page - 1) * pageSize;
    const searchParam = search ? `%${search}%` : null;

    if (searchParam) {
      const countStmt = db.prepare(
        `SELECT COUNT(DISTINCT recipes.id) as total
         FROM recipes
         WHERE recipes.is_duplicate = 0 AND recipes.name LIKE ?`
      );
      const countResult = countStmt.get(searchParam) as { total: number };

      const stmt = db.prepare(
        `SELECT
          recipes.id,
          recipes.name,
          recipes.description,
          ${CREATOR_NAME_SQL},
          COUNT(ingredients.id) as ingredientCount,
          recipes.created_at as createdAt
         FROM recipes
         JOIN users ON recipes.creator_id = users.id
         LEFT JOIN ingredients ON recipes.id = ingredients.recipe_id
         WHERE recipes.is_duplicate = 0 AND recipes.name LIKE ?
         GROUP BY recipes.id
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`
      );

      const recipes = stmt.all(searchParam, pageSize, offset) as any[];
      return {
        recipes,
        total: countResult.total,
      };
    } else {
      const countStmt = db.prepare(
        `SELECT COUNT(DISTINCT recipes.id) as total
         FROM recipes
         WHERE recipes.is_duplicate = 0`
      );
      const countResult = countStmt.get() as { total: number };

      const stmt = db.prepare(
        `SELECT
          recipes.id,
          recipes.name,
          recipes.description,
          ${CREATOR_NAME_SQL},
          COUNT(ingredients.id) as ingredientCount,
          recipes.created_at as createdAt
         FROM recipes
         JOIN users ON recipes.creator_id = users.id
         LEFT JOIN ingredients ON recipes.id = ingredients.recipe_id
         WHERE recipes.is_duplicate = 0
         GROUP BY recipes.id
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`
      );

      const recipes = stmt.all(pageSize, offset) as any[];
      return {
        recipes,
        total: countResult.total,
      };
    }
  }

  static async getNutrients(recipeId: number): Promise<Record<string, number>> {
    const db = getDb();
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
        SUM(COALESCE(ingredients_master.salt, 0) * COALESCE(ingredients.quantity, 0) / COALESCE(ingredients_master.base_size, 100)) as salt,
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

  static async update(
    id: number,
    name?: string,
    description?: string,
    instructions?: string,
    servings?: number,
    ingredients?: CreateIngredientRequest[],
    metadata?: RecipeMetadataInput
  ): Promise<Recipe> {
    const db = getDb();
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
    if (metadata?.difficulty !== undefined) {
      updates.push('difficulty = ?');
      values.push(metadata.difficulty);
    }
    if (metadata?.totalTimeMinutes !== undefined) {
      updates.push('total_time_minutes = ?');
      values.push(metadata.totalTimeMinutes);
    }
    if (metadata?.mealType !== undefined) {
      updates.push('meal_type = ?');
      values.push(metadata.mealType);
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

    if (ingredients !== undefined) {
      db.prepare('DELETE FROM ingredients WHERE recipe_id = ?').run(id);

      for (const ing of ingredients) {
        db.prepare(
          `
          INSERT INTO ingredients (recipe_id, name, quantity, unit)
          VALUES (?, ?, ?, ?)
        `
        ).run(id, ing.name.trim().toLowerCase(), ing.quantity, ing.unit || null);
      }
    }

    if (metadata?.tags !== undefined) {
      replaceRecipeTags(db, id, metadata.tags);
    }

    return (await this.findById(id))!;
  }

  static async setImage(id: number, imagePath: string | null): Promise<Recipe> {
    const db = getDb();
    const updatedAt = new Date().toISOString();

    db.prepare('UPDATE recipes SET image_path = ?, updated_at = ? WHERE id = ?').run(
      imagePath,
      updatedAt,
      id
    );

    return (await this.findById(id))!;
  }

  static async delete(id: number): Promise<void> {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM recipes WHERE id = ?');
    stmt.run(id);
  }

  static async getUniqueIngredients(): Promise<string[]> {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT DISTINCT LOWER(TRIM(name)) as name
      FROM ingredients
      WHERE recipe_id IN (
        SELECT id FROM recipes WHERE is_duplicate = 0
      )
      ORDER BY name ASC
    `);
    return (stmt.all() as { name: string }[]).map((i) => i.name);
  }

  static async listAllWithScoreAsync(
    page: number = 1,
    pageSize: number = 10,
    sortBy: string = 'date',
    search: string | undefined,
    phase: string = 'menstruation',
    filters: RecipeQueryFilters = {}
  ): Promise<{ recipes: RecipeListItemWithScore[]; total: number }> {
    const db = getDb();
    const offset = (page - 1) * pageSize;
    const searchParam = search ? `%${search}%` : null;

    const {
      predicates,
      params: filterParams,
      orderBy,
    } = buildRecipeQuery({
      ...filters,
      sort: sortBy,
    });
    const extraWhere = predicates.map((predicate) => `AND ${predicate}`).join('\n        ');

    const countStmt = db.prepare(`
      SELECT COUNT(DISTINCT recipes.id) as total
      FROM recipes
      ${RATING_AGGREGATE_JOIN}
      WHERE recipes.is_duplicate = 0
        AND (recipes.name LIKE ? OR ? IS NULL)
        ${extraWhere}
    `);
    const countResult = countStmt.get(searchParam, searchParam, ...filterParams) as {
      total: number;
    };

    const stmt = db.prepare(`
      SELECT
        recipes.id,
        recipes.name,
        recipes.description,
        recipes.image_path as imagePath,
        recipes.difficulty as difficulty,
        recipes.total_time_minutes as totalTimeMinutes,
        recipes.meal_type as mealType,
        ${CREATOR_NAME_SQL},
        COUNT(DISTINCT ingredients.id) as ingredientCount,
        recipes.created_at as createdAt,
        rr.avg_rating as ratingAverage,
        COALESCE(rr.rating_count, 0) as ratingCount,
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
      ${RATING_AGGREGATE_JOIN}
      WHERE recipes.is_duplicate = 0
        AND (recipes.name LIKE ? OR ? IS NULL)
        ${extraWhere}
      GROUP BY recipes.id
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(searchParam, searchParam, ...filterParams, pageSize, offset) as any[];

    // Fetched separately (not via LEFT JOIN) so the per-ingredient nutrient
    // SUMs above aren't multiplied out by a second one-to-many join.
    const tagsByRecipeId = getTagsForRecipeIds(
      db,
      rows.map((row: any) => row.id)
    );

    const recipes: RecipeListItemWithScore[] = rows.map((row: any) => {
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
        imagePath: row.imagePath || null,
        creatorName: row.creatorName,
        ingredientCount: row.ingredientCount,
        createdAt: row.createdAt,
        score,
        difficulty: row.difficulty || null,
        totalTimeMinutes: row.totalTimeMinutes || null,
        mealType: row.mealType || null,
        tags: tagsByRecipeId.get(row.id) || [],
        ratingAverage: row.ratingAverage ?? null,
        ratingCount: row.ratingCount ?? 0,
      };
    });

    return {
      recipes,
      total: countResult.total,
    };
  }
}
