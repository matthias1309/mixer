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
