// Recipe types

import { RecipeNutrients } from '@/lib/nutrition/types';
import { ParsedIngredient } from '@/lib/ocr/types';

export interface Ingredient {
  id: number;
  recipe_id: number;
  name: string;
  quantity: number;
  unit: string | null;
}

export interface CreateIngredientRequest {
  name: string;
  quantity: number;
  unit?: string;
}

export interface Recipe {
  id: number;
  name: string;
  description: string | null;
  instructions: string | null;
  servings: number;
  creator_id: number;
  canonical_id: number | null;
  is_duplicate: boolean;
  // File name of the recipe photo on disk (UPLOAD_CONFIG.UPLOAD_DIR), or null.
  image_path: string | null;
  difficulty: string | null;
  total_time_minutes: number | null;
  meal_type: string | null;
  created_at: string;
  updated_at: string;
  // Include nutrients in recipe
  nutrients?: RecipeNutrients;
}

// Optional metadata accepted by RecipeModel(Async).create/update (REQ-016).
// Validated against the fixed vocabulary in src/lib/constants.ts before
// reaching the model layer.
export interface RecipeMetadataInput {
  difficulty?: string | null;
  totalTimeMinutes?: number | null;
  mealType?: string | null;
  tags?: string[];
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: Ingredient[];
  creatorName: string;
  canEdit: boolean;
  canDelete: boolean;
}

export interface RecipeListItem {
  id: number;
  name: string;
  description: string | null;
  imagePath: string | null;
  creatorName: string;
  ingredientCount: number;
  createdAt: string;
  difficulty?: string | null;
  totalTimeMinutes?: number | null;
  mealType?: string | null;
  tags?: string[];
}

export interface CreateRecipeRequest {
  name: string;
  description?: string;
  instructions?: string;
  servings?: number;
  ingredients?: CreateIngredientRequest[];
  difficulty?: string | null;
  totalTimeMinutes?: number | null;
  mealType?: string | null;
  tags?: string[];
}

export interface UpdateRecipeRequest {
  name?: string;
  description?: string;
  instructions?: string;
  servings?: number;
  ingredients?: CreateIngredientRequest[];
  difficulty?: string | null;
  totalTimeMinutes?: number | null;
  mealType?: string | null;
  tags?: string[];
}

export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  amount: number;
  unit: string;
}

export interface CreateRecipeFromOcrRequest {
  uploadId: string;
  ingredients: Array<{
    ingredient_id: number;
    amount: number;
    unit: string;
  }>;
  name: string;
  portions?: number;
}
