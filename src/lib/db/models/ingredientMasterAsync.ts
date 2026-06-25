import { getDb } from '../init';

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
  salt: number | null;
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
  salt?: number;
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
    const stmt = db.prepare(`
      INSERT INTO ingredients_master (
        name, category, base_unit, base_size,
        kcal, iron, sugar, fat, protein, carbohydrates, fiber,
        salt, sodium, calcium, vitamin_d, magnesium, vitamin_b6, vitamin_b12, vitamin_e, zinc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      data.salt || null,
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

  static async findById(id: number): Promise<IngredientMaster | null> {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM ingredients_master WHERE id = ?');
    return (stmt.get(id) as IngredientMaster) || null;
  }

  static async findAll(
    page: number = 1,
    pageSize: number = 20,
    search?: string
  ): Promise<{ ingredients: IngredientMaster[]; total: number }> {
    const db = getDb();
    const offset = (page - 1) * pageSize;
    const searchParam = search ? `%${search}%` : null;

    if (searchParam) {
      const countStmt = db.prepare(
        'SELECT COUNT(*) as count FROM ingredients_master WHERE name LIKE ?'
      );
      const countResult = countStmt.get(searchParam) as { count: number };

      const stmt = db.prepare(
        'SELECT * FROM ingredients_master WHERE name LIKE ? ORDER BY name ASC LIMIT ? OFFSET ?'
      );
      const ingredients = (stmt.all(searchParam, pageSize, offset) as IngredientMaster[]) || [];

      return {
        ingredients,
        total: countResult.count,
      };
    } else {
      const countStmt = db.prepare(
        'SELECT COUNT(*) as count FROM ingredients_master'
      );
      const countResult = countStmt.get() as { count: number };

      const stmt = db.prepare(
        'SELECT * FROM ingredients_master ORDER BY name ASC LIMIT ? OFFSET ?'
      );
      const ingredients = (stmt.all(pageSize, offset) as IngredientMaster[]) || [];

      return {
        ingredients,
        total: countResult.count,
      };
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
      salt: data.salt !== undefined ? data.salt : ingredient.salt,
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
    const stmt = db.prepare(`
      UPDATE ingredients_master SET
        name = ?, category = ?, base_unit = ?, base_size = ?,
        kcal = ?, iron = ?, sugar = ?, fat = ?, protein = ?, carbohydrates = ?, fiber = ?,
        salt = ?, sodium = ?, calcium = ?, vitamin_d = ?, magnesium = ?, vitamin_b6 = ?, vitamin_b12 = ?, vitamin_e = ?, zinc = ?,
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
      updateData.salt,
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

    return (await this.findById(id))!;
  }

  static async delete(id: number): Promise<void> {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM ingredients_master WHERE id = ?');
    stmt.run(id);
  }
}
