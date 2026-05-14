// Type definition for recipe data
interface RecipeData {
  name: string;
  description: string;
  instructions: string;
  servings: number;
  ingredients: Array<{ name: string; quantity: number }>;
}

/**
 * Register a new user and verify successful registration (redirect to dashboard)
 */
export const registerUser = (email: string, password: string): void => {
  cy.visit('http://localhost:3000/register');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').first().type(password);
  cy.get('input[type="password"]').last().type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
};

/**
 * Login a user and verify result
 * @param shouldFail - If true, expects error message instead of dashboard redirect
 */
export const loginUser = (email: string, password: string, shouldFail = false): void => {
  cy.visit('http://localhost:3000/login');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();

  if (shouldFail) {
    cy.contains('Invalid email or password').should('be.visible');
  } else {
    cy.url().should('include', '/dashboard');
  }
};

/**
 * Create a new recipe and verify successful creation
 * Extracts and returns the recipe ID from the URL
 */
export const createRecipe = (data: RecipeData): number => {
  cy.contains('Create Recipe').click();
  cy.url().should('include', '/recipes/new');

  // Fill recipe form
  cy.get('input').first().type(data.name);
  cy.get('textarea').first().type(data.description);
  cy.get('textarea').eq(1).type(data.instructions);
  cy.get('input[type="number"]').first().clear().type(data.servings.toString());

  // Add ingredients
  data.ingredients.forEach((ingredient) => {
    cy.contains('Add Ingredient').click();
    cy.get('input[placeholder="Ingredient name"]').last().type(ingredient.name);
    cy.get('input[placeholder="Qty"]').last().type(ingredient.quantity.toString());
  });

  // Submit form
  cy.contains('Create Recipe').click();

  // Verify on recipe detail page and extract recipe ID
  cy.url().should('match', /\/recipes\/\d+$/);
  cy.contains(data.name).should('be.visible');

  // Extract recipe ID from URL
  let recipeId = 0;
  cy.url().then((url) => {
    const match = url.match(/\/recipes\/(\d+)$/);
    if (match) {
      recipeId = parseInt(match[1], 10);
    }
  });

  return recipeId;
};

/**
 * Edit an existing recipe with partial data and verify changes
 */
export const editRecipe = (recipeId: number, newData: Partial<RecipeData>): void => {
  cy.visit(`http://localhost:3000/recipes/${recipeId}/edit`);
  cy.url().should('include', `/recipes/${recipeId}/edit`);

  // Update name if provided
  if (newData.name) {
    cy.get('input').first().clear().type(newData.name);
  }

  // Update description if provided
  if (newData.description) {
    cy.get('textarea').first().clear().type(newData.description);
  }

  // Update instructions if provided
  if (newData.instructions) {
    cy.get('textarea').eq(1).clear().type(newData.instructions);
  }

  // Update servings if provided
  if (newData.servings) {
    cy.get('input[type="number"]').first().clear().type(newData.servings.toString());
  }

  // Submit form
  cy.contains('Update Recipe').click();

  // Verify on recipe detail page and changes are visible
  cy.url().should('include', `/recipes/${recipeId}`);
  if (newData.name) {
    cy.contains(newData.name).should('be.visible');
  }
};
