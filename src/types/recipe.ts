// Recipe types

import { RecipeNutrients } from '@/lib/nutrition/types';

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
  created_at: string;
  updated_at: string;
  // Include nutrients in recipe
  nutrients?: RecipeNutrients;
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
  creatorName: string;
  ingredientCount: number;
  createdAt: string;
}

export interface CreateRecipeRequest {
  name: string;
  description?: string;
  instructions?: string;
  servings?: number;
  ingredients?: CreateIngredientRequest[];
}

export interface UpdateRecipeRequest {
  name?: string;
  description?: string;
  instructions?: string;
  servings?: number;
  ingredients?: CreateIngredientRequest[];
}
