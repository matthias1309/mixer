import * as journeyHelpers from './helpers/user-journey-helpers';

describe('User Journey - Happy Path', () => {
  it('should complete full user journey: register → login → create → edit → delete', () => {
    // Generate unique email for this test
    const testEmail = `user-happy-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123';

    // Register
    journeyHelpers.registerUser(testEmail, testPassword);

    // Create recipe
    const recipeData = {
      name: 'Test Recipe',
      description: 'A test recipe',
      instructions: '1. Mix\n2. Cook\n3. Serve',
      servings: 2,
      ingredients: [{ name: 'Tomato', quantity: 2 }],
    };

    journeyHelpers.createRecipe(recipeData);

    // Get recipe ID from URL
    let recipeId = 0;
    cy.url().then((url) => {
      const match = url.match(/\/recipes\/(\d+)$/);
      if (match) {
        recipeId = parseInt(match[1], 10);
      }
    });

    // Edit recipe
    cy.then(() => {
      journeyHelpers.editRecipe(recipeId, { name: 'Updated Test Recipe', servings: 4 });
    });

    // Verify updated name is visible
    cy.contains('Updated Test Recipe').should('be.visible');

    // Delete recipe
    cy.then(() => {
      journeyHelpers.deleteRecipe(recipeId);
    });

    // Verify back on dashboard (recipe is gone)
    cy.url().should('include', '/dashboard');
  });
});
