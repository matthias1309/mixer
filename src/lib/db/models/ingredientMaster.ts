import { getDatabase } from '../init';

export interface IngredientMaster {
  id: number;
  name: string;
  category: string | null;
  base_unit: string;
  base_size: number;
  kcal: number | null;
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
  iron: number | null;
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
  iron?: number;
  zinc?: number;
}

export class IngredientMasterModel {
  static create(data: CreateIngredientMasterRequest): IngredientMaster {
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT INTO ingredients_master (
        name, category, base_unit, base_size,
        kcal, sugar, fat, protein, carbohydrates, fiber,
        sodium, calcium, vitamin_d, magnesium, vitamin_b6, vitamin_b12, vitamin_e, iron, zinc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      data.name.trim(),
      data.category?.trim() || null,
      data.base_unit || 'g',
      data.base_size || 100,
      data.kcal || null,
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
      data.iron || null,
      data.zinc || null
    ) as { lastInsertRowid: number };

    return this.findById(Number(info.lastInsertRowid))!;
  }

  static findAll(
    page: number = 1,
    pageSize: number = 20,
    search?: string
  ): { ingredients: IngredientMaster[]; total: number } {
    const db = getDatabase();
    let query = 'SELECT * FROM ingredients_master';
    const params: any[] = [];

    if (search) {
      query += ' WHERE name LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY name ASC';

    const countStmt = db.prepare(
      search
        ? 'SELECT COUNT(*) as count FROM ingredients_master WHERE name LIKE ?'
        : 'SELECT COUNT(*) as count FROM ingredients_master'
    );
    const countResult = countStmt.get(...params) as { count: number };

    const offset = (page - 1) * pageSize;
    query += ` LIMIT ? OFFSET ?`;
    params.push(pageSize, offset);

    const stmt = db.prepare(query);
    const ingredients = (stmt.all(...params) as IngredientMaster[]) || [];

    return {
      ingredients,
      total: countResult.count,
    };
  }

  static findById(id: number): IngredientMaster | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM ingredients_master WHERE id = ?');
    return (stmt.get(id) as IngredientMaster) || null;
  }

  static update(
    id: number,
    data: Partial<CreateIngredientMasterRequest>
  ): IngredientMaster {
    const db = getDatabase();
    const ingredient = this.findById(id);
    if (!ingredient) {
      throw new Error('Ingredient not found');
    }

    const updateData = {
      name: data.name !== undefined ? data.name.trim() : ingredient.name,
      category:
        data.category !== undefined
          ? data.category.trim() || null
          : ingredient.category,
      base_unit: data.base_unit || ingredient.base_unit,
      base_size: data.base_size || ingredient.base_size,
      kcal: data.kcal !== undefined ? data.kcal : ingredient.kcal,
      sugar: data.sugar !== undefined ? data.sugar : ingredient.sugar,
      fat: data.fat !== undefined ? data.fat : ingredient.fat,
      protein: data.protein !== undefined ? data.protein : ingredient.protein,
      carbohydrates:
        data.carbohydrates !== undefined
          ? data.carbohydrates
          : ingredient.carbohydrates,
      fiber: data.fiber !== undefined ? data.fiber : ingredient.fiber,
      sodium: data.sodium !== undefined ? data.sodium : ingredient.sodium,
      calcium: data.calcium !== undefined ? data.calcium : ingredient.calcium,
      vitamin_d:
        data.vitamin_d !== undefined ? data.vitamin_d : ingredient.vitamin_d,
      magnesium:
        data.magnesium !== undefined ? data.magnesium : ingredient.magnesium,
      vitamin_b6:
        data.vitamin_b6 !== undefined ? data.vitamin_b6 : ingredient.vitamin_b6,
      vitamin_b12:
        data.vitamin_b12 !== undefined
          ? data.vitamin_b12
          : ingredient.vitamin_b12,
      vitamin_e:
        data.vitamin_e !== undefined ? data.vitamin_e : ingredient.vitamin_e,
      iron: data.iron !== undefined ? data.iron : ingredient.iron,
      zinc: data.zinc !== undefined ? data.zinc : ingredient.zinc,
    };

    const stmt = db.prepare(`
      UPDATE ingredients_master SET
        name = ?, category = ?, base_unit = ?, base_size = ?,
        kcal = ?, sugar = ?, fat = ?, protein = ?, carbohydrates = ?, fiber = ?,
        sodium = ?, calcium = ?, vitamin_d = ?, magnesium = ?, vitamin_b6 = ?, vitamin_b12 = ?, vitamin_e = ?, iron = ?, zinc = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmt.run(
      updateData.name,
      updateData.category,
      updateData.base_unit,
      updateData.base_size,
      updateData.kcal,
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
      updateData.iron,
      updateData.zinc,
      id
    );

    return this.findById(id)!;
  }

  static delete(id: number): void {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM ingredients_master WHERE id = ?');
    stmt.run(id);
  }
}
