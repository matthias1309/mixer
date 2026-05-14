// Type definition for recipe data
interface RecipeData {
  name: string;
  description: string;
  instructions: string;
  servings: number;
  ingredients: Array<{ name: string; quantity: number }>;
}

// Helper functions will be added in following tasks
