// Recipe types

export interface Ingredient {
  id?: string;
  name: string;
  quantity: number;
  unit?: string;
}

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string;
  servings: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRecipeRequest {
  name: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string;
  servings?: number;
}

export interface UpdateRecipeRequest {
  name?: string;
  description?: string;
  ingredients?: Ingredient[];
  instructions?: string;
  servings?: number;
}

export interface RecipeListItem {
  id: string;
  name: string;
  description?: string;
  ingredientCount: number;
  createdAt: Date;
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: Ingredient[];
}
