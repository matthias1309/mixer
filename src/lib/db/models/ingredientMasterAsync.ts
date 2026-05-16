import { getDb, isPostgres } from '../init';
import { Pool } from 'pg';
import Database from 'better-sqlite3';

export interface IngredientMaster {
  id: number;
  name: string;
  category: string | null;
  base_unit: string;
  base_size: number;
  kcal: number | null;
  iron: number | null;
  sugar: number | null;
  fat: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fiber: number | null;
  sodium: number | null;
  calcium: number | null;
  vitamin_d: number | null;
  magnesium: number | null;
  vitamin_b6: number | null;
  vitamin_b12: number | null;
  vitamin_e: number | null;
  zinc: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateIngredientMasterRequest {
  name: string;
  category?: string;
  base_unit?: string;
  base_size?: number;
  kcal?: number;
  iron?: number;
  sugar?: number;
  fat?: number;
  protein?: number;
  carbohydrates?: number;
  fiber?: number;
  sodium?: number;
  calcium?: number;
  vitamin_d?: number;
  magnesium?: number;
  vitamin_b6?: number;
  vitamin_b12?: number;
  vitamin_e?: number;
  zinc?: number;
}

export class IngredientMasterModelAsync {
  static async create(data: CreateIngredientMasterRequest): Promise<IngredientMaster> {
    const db = getDb();

    if (isPostgres()) {
      const pool = db as Pool;
      const result = await pool.query(
        `INSERT INTO nutrition_ingredients (
          name, category, base_unit, base_size,
          kcal, iron, sugar, fat, protein, carbohydrates, fiber,
          sodium, calcium, vitamin_d, magnesium, vitamin_b6, vitamin_b12, vitamin_e, zinc
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING id`,
        [
          data.name.trim(),
          data.category?.trim() || null,
          data.base_unit || 'g',
          data.base_size || 100,
          data.kcal || null,
          data.iron || null,
          data.sugar || null,
          data.fat || null,
          data.protein || null,
          data.carbohydrates || null,
          data.fiber || null,
          data.sodium || null,
          data.calcium || null,
          data.vitamin_d || null,
          data.magnesium || null,
          data.vitamin_b6 || null,
          data.vitamin_b12 || null,
          data.vitamin_e || null,
          data.zinc || null,
        ]
      );
      return (await this.findById(result.rows[0].id))!;
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare(`
        INSERT INTO nutrition_ingredients (
          name, category, base_unit, base_size,
          kcal, iron, sugar, fat, protein, carbohydrates, fiber,
          sodium, calcium, vitamin_d, magnesium, vitamin_b6, vitamin_b12, vitamin_e, zinc
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(
        data.name.trim(),
        data.category?.trim() || null,
        data.base_unit || 'g',
        data.base_size || 100,
        data.kcal || null,
        data.iron || null,
        data.sugar || null,
        data.fat || null,
        data.protein || null,
        data.carbohydrates || null,
        data.fiber || null,
        data.sodium || null,
        data.calcium || null,
        data.vitamin_d || null,
        data.magnesium || null,
        data.vitamin_b6 || null,
        data.vitamin_b12 || null,
        data.vitamin_e || null,
        data.zinc || null
      ) as { lastInsertRowid: number };

      return (await this.findById(Number(info.lastInsertRowid)))!;
    }
  }

  static async findById(id: number): Promise<IngredientMaster | null> {
    const db = getDb();

    if (isPostgres()) {
      const pool = db as Pool;
      const result = await pool.query(
        'SELECT * FROM nutrition_ingredients WHERE id = $1',
        [id]
      );
      return (result.rows[0] as IngredientMaster) || null;
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare('SELECT * FROM nutrition_ingredients WHERE id = ?');
      return (stmt.get(id) as IngredientMaster) || null;
    }
  }

  static async findAll(
    page: number = 1,
    pageSize: number = 20,
    search?: string
  ): Promise<{ ingredients: IngredientMaster[]; total: number }> {
    const db = getDb();
    const offset = (page - 1) * pageSize;
    const searchParam = search ? `%${search}%` : null;

    if (isPostgres()) {
      const pool = db as Pool;

      if (searchParam) {
        const countResult = await pool.query(
          'SELECT COUNT(*) as count FROM nutrition_ingredients WHERE name ILIKE $1',
          [searchParam]
        );

        const result = await pool.query(
          'SELECT * FROM nutrition_ingredients WHERE name ILIKE $1 ORDER BY name ASC LIMIT $2 OFFSET $3',
          [searchParam, pageSize, offset]
        );

        return {
          ingredients: result.rows as IngredientMaster[],
          total: parseInt(countResult.rows[0].count, 10),
        };
      } else {
        const countResult = await pool.query(
          'SELECT COUNT(*) as count FROM nutrition_ingredients'
        );

        const result = await pool.query(
          'SELECT * FROM nutrition_ingredients ORDER BY name ASC LIMIT $1 OFFSET $2',
          [pageSize, offset]
        );

        return {
          ingredients: result.rows as IngredientMaster[],
          total: parseInt(countResult.rows[0].count, 10),
        };
      }
    } else {
      const sqlite = db as Database.Database;

      if (searchParam) {
        const countStmt = sqlite.prepare(
          'SELECT COUNT(*) as count FROM nutrition_ingredients WHERE name LIKE ?'
        );
        const countResult = countStmt.get(searchParam) as { count: number };

        const stmt = sqlite.prepare(
          'SELECT * FROM nutrition_ingredients WHERE name LIKE ? ORDER BY name ASC LIMIT ? OFFSET ?'
        );
        const ingredients = (stmt.all(searchParam, pageSize, offset) as IngredientMaster[]) || [];

        return {
          ingredients,
          total: countResult.count,
        };
      } else {
        const countStmt = sqlite.prepare(
          'SELECT COUNT(*) as count FROM nutrition_ingredients'
        );
        const countResult = countStmt.get() as { count: number };

        const stmt = sqlite.prepare(
          'SELECT * FROM nutrition_ingredients ORDER BY name ASC LIMIT ? OFFSET ?'
        );
        const ingredients = (stmt.all(pageSize, offset) as IngredientMaster[]) || [];

        return {
          ingredients,
          total: countResult.count,
        };
      }
    }
  }

  static async update(
    id: number,
    data: Partial<CreateIngredientMasterRequest>
  ): Promise<IngredientMaster> {
    const ingredient = await this.findById(id);
    if (!ingredient) {
      throw new Error('Ingredient not found');
    }

    const updateData = {
      name: data.name !== undefined ? data.name.trim() : ingredient.name,
      category:
        data.category !== undefined ? (data.category.trim() || null) : ingredient.category,
      base_unit: data.base_unit || ingredient.base_unit,
      base_size: data.base_size || ingredient.base_size,
      kcal: data.kcal !== undefined ? data.kcal : ingredient.kcal,
      iron: data.iron !== undefined ? data.iron : ingredient.iron,
      sugar: data.sugar !== undefined ? data.sugar : ingredient.sugar,
      fat: data.fat !== undefined ? data.fat : ingredient.fat,
      protein: data.protein !== undefined ? data.protein : ingredient.protein,
      carbohydrates:
        data.carbohydrates !== undefined ? data.carbohydrates : ingredient.carbohydrates,
      fiber: data.fiber !== undefined ? data.fiber : ingredient.fiber,
      sodium: data.sodium !== undefined ? data.sodium : ingredient.sodium,
      calcium: data.calcium !== undefined ? data.calcium : ingredient.calcium,
      vitamin_d: data.vitamin_d !== undefined ? data.vitamin_d : ingredient.vitamin_d,
      magnesium: data.magnesium !== undefined ? data.magnesium : ingredient.magnesium,
      vitamin_b6: data.vitamin_b6 !== undefined ? data.vitamin_b6 : ingredient.vitamin_b6,
      vitamin_b12: data.vitamin_b12 !== undefined ? data.vitamin_b12 : ingredient.vitamin_b12,
      vitamin_e: data.vitamin_e !== undefined ? data.vitamin_e : ingredient.vitamin_e,
      zinc: data.zinc !== undefined ? data.zinc : ingredient.zinc,
    };

    const db = getDb();

    if (isPostgres()) {
      const pool = db as Pool;
      await pool.query(
        `UPDATE nutrition_ingredients SET
          name = $1, category = $2, base_unit = $3, base_size = $4,
          kcal = $5, iron = $6, sugar = $7, fat = $8, protein = $9, carbohydrates = $10, fiber = $11,
          sodium = $12, calcium = $13, vitamin_d = $14, magnesium = $15, vitamin_b6 = $16, vitamin_b12 = $17, vitamin_e = $18, zinc = $19,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $20`,
        [
          updateData.name,
          updateData.category,
          updateData.base_unit,
          updateData.base_size,
          updateData.kcal,
          updateData.iron,
          updateData.sugar,
          updateData.fat,
          updateData.protein,
          updateData.carbohydrates,
          updateData.fiber,
          updateData.sodium,
          updateData.calcium,
          updateData.vitamin_d,
          updateData.magnesium,
          updateData.vitamin_b6,
          updateData.vitamin_b12,
          updateData.vitamin_e,
          updateData.zinc,
          id,
        ]
      );
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare(`
        UPDATE nutrition_ingredients SET
          name = ?, category = ?, base_unit = ?, base_size = ?,
          kcal = ?, iron = ?, sugar = ?, fat = ?, protein = ?, carbohydrates = ?, fiber = ?,
          sodium = ?, calcium = ?, vitamin_d = ?, magnesium = ?, vitamin_b6 = ?, vitamin_b12 = ?, vitamin_e = ?, zinc = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      stmt.run(
        updateData.name,
        updateData.category,
        updateData.base_unit,
        updateData.base_size,
        updateData.kcal,
        updateData.iron,
        updateData.sugar,
        updateData.fat,
        updateData.protein,
        updateData.carbohydrates,
        updateData.fiber,
        updateData.sodium,
        updateData.calcium,
        updateData.vitamin_d,
        updateData.magnesium,
        updateData.vitamin_b6,
        updateData.vitamin_b12,
        updateData.vitamin_e,
        updateData.zinc,
        id
      );
    }

    return (await this.findById(id))!;
  }

  static async delete(id: number): Promise<void> {
    const db = getDb();

    if (isPostgres()) {
      const pool = db as Pool;
      await pool.query('DELETE FROM nutrition_ingredients WHERE id = $1', [id]);
    } else {
      const sqlite = db as Database.Database;
      const stmt = sqlite.prepare('DELETE FROM nutrition_ingredients WHERE id = ?');
      stmt.run(id);
    }
  }
}
