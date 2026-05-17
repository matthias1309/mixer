export interface Ingredient {
  id: number;
  name: string;
  category: string;
  base_unit: string;
  base_size: number;
  kcal: number | null;
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
  created_at: Date;
  updated_at: Date;
}

export interface IngredientConversion {
  id: number;
  ingredient_id: number;
  unit: string;
  amount_in_base_unit: number;
  created_at: Date;
}

export interface Nutrients {
  kcal: number;
  sugar: number;
  fat: number;
  protein: number;
  carbohydrates: number;
  fiber: number;
  salt: number;
  sodium: number;
  calcium: number;
  vitamin_d: number;
  magnesium: number;
  vitamin_b6: number;
  vitamin_b12: number;
  vitamin_e: number;
  zinc: number;
}

export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  amount: number;
  unit: string;
  calculated_base_amount: number;
}

export interface RecipeNutrients {
  id: number;
  recipe_id: number;
  portions: number;
  total: Nutrients;
  per_portion: Nutrients;
  last_calculated: Date | null;
  created_at: Date;
  updated_at: Date;
}

export type NutrientKey = keyof Nutrients;

export const NUTRIENT_KEYS: NutrientKey[] = [
  'kcal',
  'sugar',
  'fat',
  'protein',
  'carbohydrates',
  'fiber',
  'salt',
  'sodium',
  'calcium',
  'vitamin_d',
  'magnesium',
  'vitamin_b6',
  'vitamin_b12',
  'vitamin_e',
  'zinc',
];
