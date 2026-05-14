import { Ingredient } from '@/lib/nutrition/types';

export const INGREDIENT_SEEDS: Omit<Ingredient, 'id' | 'created_at' | 'updated_at'>[] = [
  // Obst (Fruit)
  {
    name: 'Apfel',
    category: 'Obst',
    base_unit: 'g',
    base_size: 100,
    kcal: 52,
    sugar: 10.4,
    fat: 0.3,
    protein: 0.3,
    carbohydrates: 13.8,
    fiber: 2.4,
    sodium: 2,
    calcium: 5,
    vitamin_d: 0,
    magnesium: 5,
    vitamin_b6: 0.04,
    vitamin_b12: 0,
    vitamin_e: 0.18,
    zinc: 0.04,
  },
  {
    name: 'Banane',
    category: 'Obst',
    base_unit: 'g',
    base_size: 100,
    kcal: 89,
    sugar: 12,
    fat: 0.3,
    protein: 1.1,
    carbohydrates: 23,
    fiber: 2.6,
    sodium: 2,
    calcium: 5,
    vitamin_d: 0,
    magnesium: 27,
    vitamin_b6: 0.37,
    vitamin_b12: 0,
    vitamin_e: 0.1,
    zinc: 0.15,
  },
  {
    name: 'Orange',
    category: 'Obst',
    base_unit: 'g',
    base_size: 100,
    kcal: 47,
    sugar: 9.3,
    fat: 0.2,
    protein: 0.9,
    carbohydrates: 11.8,
    fiber: 2.4,
    sodium: 1,
    calcium: 40,
    vitamin_d: 0,
    magnesium: 10,
    vitamin_b6: 0.06,
    vitamin_b12: 0,
    vitamin_e: 0.18,
    zinc: 0.07,
  },
  // Gemüse (Vegetables)
  {
    name: 'Brokkoli',
    category: 'Gemüse',
    base_unit: 'g',
    base_size: 100,
    kcal: 34,
    sugar: 2.2,
    fat: 0.4,
    protein: 2.8,
    carbohydrates: 7,
    fiber: 2.4,
    sodium: 64,
    calcium: 47,
    vitamin_d: 0,
    magnesium: 21,
    vitamin_b6: 0.18,
    vitamin_b12: 0,
    vitamin_e: 0.78,
    zinc: 0.4,
  },
  {
    name: 'Karotte',
    category: 'Gemüse',
    base_unit: 'g',
    base_size: 100,
    kcal: 41,
    sugar: 4.7,
    fat: 0.2,
    protein: 0.9,
    carbohydrates: 10,
    fiber: 2.8,
    sodium: 69,
    calcium: 33,
    vitamin_d: 0,
    magnesium: 12,
    vitamin_b6: 0.14,
    vitamin_b12: 0,
    vitamin_e: 0.66,
    zinc: 0.24,
  },
  {
    name: 'Spinat',
    category: 'Gemüse',
    base_unit: 'g',
    base_size: 100,
    kcal: 23,
    sugar: 0.4,
    fat: 0.4,
    protein: 2.7,
    carbohydrates: 3.6,
    fiber: 2.2,
    sodium: 79,
    calcium: 99,
    vitamin_d: 0,
    magnesium: 79,
    vitamin_b6: 0.13,
    vitamin_b12: 0,
    vitamin_e: 2.03,
    zinc: 0.53,
  },
  // Fleisch (Meat)
  {
    name: 'Hähnchen (Brust)',
    category: 'Fleisch',
    base_unit: 'g',
    base_size: 100,
    kcal: 165,
    sugar: 0,
    fat: 3.6,
    protein: 31,
    carbohydrates: 0,
    fiber: 0,
    sodium: 74,
    calcium: 11,
    vitamin_d: 0.1,
    magnesium: 29,
    vitamin_b6: 0.9,
    vitamin_b12: 0.3,
    vitamin_e: 0.25,
    zinc: 0.6,
  },
  {
    name: 'Rindfleisch (mager)',
    category: 'Fleisch',
    base_unit: 'g',
    base_size: 100,
    kcal: 143,
    sugar: 0,
    fat: 4.9,
    protein: 26,
    carbohydrates: 0,
    fiber: 0,
    sodium: 75,
    calcium: 16,
    vitamin_d: 0.13,
    magnesium: 26,
    vitamin_b6: 0.7,
    vitamin_b12: 1.5,
    vitamin_e: 0.15,
    zinc: 7.8,
  },
  // Milchprodukte (Dairy)
  {
    name: 'Joghurt (natur)',
    category: 'Milchprodukte',
    base_unit: 'ml',
    base_size: 100,
    kcal: 61,
    sugar: 4.7,
    fat: 0.4,
    protein: 3.5,
    carbohydrates: 4.7,
    fiber: 0,
    sodium: 50,
    calcium: 110,
    vitamin_d: 0.04,
    magnesium: 12,
    vitamin_b6: 0.05,
    vitamin_b12: 0.4,
    vitamin_e: 0.01,
    zinc: 0.6,
  },
  {
    name: 'Milch (Vollmilch)',
    category: 'Milchprodukte',
    base_unit: 'ml',
    base_size: 100,
    kcal: 61,
    sugar: 4.8,
    fat: 3.3,
    protein: 3.2,
    carbohydrates: 4.8,
    fiber: 0,
    sodium: 49,
    calcium: 113,
    vitamin_d: 0.05,
    magnesium: 10,
    vitamin_b6: 0.06,
    vitamin_b12: 0.5,
    vitamin_e: 0.07,
    zinc: 0.4,
  },
];

export const CONVERSION_SEEDS = [
  { ingredient_name: 'Apfel', unit: 'g', amount_in_base_unit: 1 },
  { ingredient_name: 'Apfel', unit: 'Stück', amount_in_base_unit: 1.82 },
  { ingredient_name: 'Apfel', unit: 'kg', amount_in_base_unit: 10 },
  
  { ingredient_name: 'Banane', unit: 'g', amount_in_base_unit: 1 },
  { ingredient_name: 'Banane', unit: 'Stück', amount_in_base_unit: 1.2 },
  
  { ingredient_name: 'Orange', unit: 'g', amount_in_base_unit: 1 },
  { ingredient_name: 'Orange', unit: 'Stück', amount_in_base_unit: 1.5 },
  
  { ingredient_name: 'Brokkoli', unit: 'g', amount_in_base_unit: 1 },
  { ingredient_name: 'Brokkoli', unit: 'Röschen', amount_in_base_unit: 0.55 },
  
  { ingredient_name: 'Karotte', unit: 'g', amount_in_base_unit: 1 },
  { ingredient_name: 'Karotte', unit: 'Stück', amount_in_base_unit: 0.61 },
  
  { ingredient_name: 'Spinat', unit: 'g', amount_in_base_unit: 1 },
  
  { ingredient_name: 'Hähnchen (Brust)', unit: 'g', amount_in_base_unit: 1 },
  
  { ingredient_name: 'Rindfleisch (mager)', unit: 'g', amount_in_base_unit: 1 },
  
  { ingredient_name: 'Joghurt (natur)', unit: 'ml', amount_in_base_unit: 1 },
  { ingredient_name: 'Joghurt (natur)', unit: 'EL', amount_in_base_unit: 15 },
  
  { ingredient_name: 'Milch (Vollmilch)', unit: 'ml', amount_in_base_unit: 1 },
  { ingredient_name: 'Milch (Vollmilch)', unit: 'l', amount_in_base_unit: 1000 },
  { ingredient_name: 'Milch (Vollmilch)', unit: 'Tasse', amount_in_base_unit: 240 },
];

/**
 * Seed ingredients table with nutritional data
 * @param db - Database instance
 */
export async function seedIngredients(db: any) {
  const existingCount = await db.get(
    'SELECT COUNT(*) as count FROM ingredients'
  );

  if (existingCount.count > 0) {
    // eslint-disable-next-line no-console
    console.log('Ingredients already seeded, skipping...');
    return;
  }

  for (const ingredient of INGREDIENT_SEEDS) {
    await db.run(
      `INSERT INTO ingredients (
        name, category, base_unit, base_size,
        kcal, sugar, fat, protein, carbohydrates, fiber, sodium,
        calcium, vitamin_d, magnesium, vitamin_b6, vitamin_b12, vitamin_e, zinc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ingredient.name,
        ingredient.category,
        ingredient.base_unit,
        ingredient.base_size,
        ingredient.kcal,
        ingredient.sugar,
        ingredient.fat,
        ingredient.protein,
        ingredient.carbohydrates,
        ingredient.fiber,
        ingredient.sodium,
        ingredient.calcium,
        ingredient.vitamin_d,
        ingredient.magnesium,
        ingredient.vitamin_b6,
        ingredient.vitamin_b12,
        ingredient.vitamin_e,
        ingredient.zinc,
      ]
    );
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Seeded ${INGREDIENT_SEEDS.length} ingredients`);
}

/**
 * Seed ingredient conversions table with unit conversion data
 * @param db - Database instance
 */
export async function seedConversions(db: any) {
  const existingCount = await db.get(
    'SELECT COUNT(*) as count FROM ingredient_conversions'
  );

  if (existingCount.count > 0) {
    // eslint-disable-next-line no-console
    console.log('Conversions already seeded, skipping...');
    return;
  }

  for (const conv of CONVERSION_SEEDS) {
    const ingredient = await db.get(
      'SELECT id FROM ingredients WHERE name = ?',
      [conv.ingredient_name]
    );

    if (ingredient) {
      await db.run(
        `INSERT INTO ingredient_conversions (ingredient_id, unit, amount_in_base_unit)
         VALUES (?, ?, ?)`,
        [ingredient.id, conv.unit, conv.amount_in_base_unit]
      );
    }
  }

  // eslint-disable-next-line no-console
  console.log(`✓ Seeded conversions`);
}
