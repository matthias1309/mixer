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

describe('User Journey - Login Errors', () => {
  beforeEach(() => {
    // Create a test user for login tests
    const testEmail = `user-login-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123';
    journeyHelpers.registerUser(testEmail, testPassword);
    journeyHelpers.logoutUser();

    // Store for use in tests
    cy.wrap(testEmail).as('testEmail');
    cy.wrap(testPassword).as('testPassword');
  });

  it('should show error for wrong password', function () {
    journeyHelpers.loginUser(this.testEmail, 'WrongPassword123', true);
  });

  it('should show error for non-existent user', () => {
    journeyHelpers.loginUser('nonexistent@example.com', 'SomePassword123', true);
  });
});

describe('User Journey - Recipe Validation', () => {
  beforeEach(() => {
    const testEmail = `user-validation-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123';
    journeyHelpers.registerUser(testEmail, testPassword);
  });

  it('should show error for empty recipe name', () => {
    cy.contains('Create Recipe').click();
    cy.url().should('include', '/recipes/new');

    // Leave name empty, fill other fields
    cy.get('textarea').first().type('A test recipe');
    cy.get('textarea').eq(1).type('1. Mix\n2. Cook\n3. Serve');
    cy.get('input[type="number"]').first().clear().type('2');
    cy.contains('Add Ingredient').click();
    cy.get('input[placeholder="Ingredient name"]').type('Tomato');
    cy.get('input[placeholder="Qty"]').type('2');

    // Try to submit without name
    cy.contains('Create Recipe').click();
    cy.contains(/name|required/i).should('be.visible');
  });

  it('should show error for invalid servings', () => {
    cy.contains('Create Recipe').click();
    cy.url().should('include', '/recipes/new');

    // Fill form but set invalid servings
    cy.get('input').first().type('Test Recipe');
    cy.get('textarea').first().type('A test recipe');
    cy.get('textarea').eq(1).type('1. Mix\n2. Cook\n3. Serve');
    cy.get('input[type="number"]').first().clear().type('0');
    cy.contains('Add Ingredient').click();
    cy.get('input[placeholder="Ingredient name"]').type('Tomato');
    cy.get('input[placeholder="Qty"]').type('2');

    // Try to submit with invalid servings
    cy.contains('Create Recipe').click();
    cy.contains(/servings|greater|valid/i).should('be.visible');
  });

  it('should show error for recipe without ingredients', () => {
    cy.contains('Create Recipe').click();
    cy.url().should('include', '/recipes/new');

    // Fill form but don't add ingredients
    cy.get('input').first().type('Test Recipe');
    cy.get('textarea').first().type('A test recipe');
    cy.get('textarea').eq(1).type('1. Mix\n2. Cook\n3. Serve');
    cy.get('input[type="number"]').first().clear().type('2');

    // Try to submit without ingredients
    cy.contains('Create Recipe').click();
    cy.contains(/ingredient|require/i).should('be.visible');
  });
});
