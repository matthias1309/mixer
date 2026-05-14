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

describe('User Journey - Permissions', () => {
  it('User2 cannot edit User1\'s recipe', () => {
    // USER 1: Register and create recipe
    const user1Email = `user1-${Date.now()}@example.com`;
    const user1Password = 'SecurePassword123';
    journeyHelpers.registerUser(user1Email, user1Password);

    const recipeData = {
      name: 'User1 Recipe',
      description: 'A recipe by user 1',
      instructions: '1. Mix\n2. Cook',
      servings: 2,
      ingredients: [{ name: 'Tomato', quantity: 2 }],
    };

    journeyHelpers.createRecipe(recipeData);

    // Get recipe ID
    let recipeId = 0;
    cy.url().then((url) => {
      const match = url.match(/\/recipes\/(\d+)$/);
      if (match) {
        recipeId = parseInt(match[1], 10);
      }
    });

    // USER 1: Logout
    cy.then(() => {
      journeyHelpers.logoutUser();
    });

    // USER 2: Register with different email
    const user2Email = `user2-${Date.now()}@example.com`;
    const user2Password = 'SecurePassword123';
    journeyHelpers.registerUser(user2Email, user2Password);

    // USER 2: Try to access User1's recipe edit page
    cy.then(() => {
      journeyHelpers.verifyNoAccess(recipeId);
    });
  });

  it('User2 cannot delete User1\'s recipe', () => {
    // USER 1: Register and create recipe
    const user1Email = `user1-delete-${Date.now()}@example.com`;
    const user1Password = 'SecurePassword123';
    journeyHelpers.registerUser(user1Email, user1Password);

    const recipeData = {
      name: 'User1 Recipe Delete Test',
      description: 'A recipe by user 1',
      instructions: '1. Mix\n2. Cook',
      servings: 2,
      ingredients: [{ name: 'Tomato', quantity: 2 }],
    };

    journeyHelpers.createRecipe(recipeData);

    // Get recipe ID
    let recipeId = 0;
    cy.url().then((url) => {
      const match = url.match(/\/recipes\/(\d+)$/);
      if (match) {
        recipeId = parseInt(match[1], 10);
      }
    });

    // USER 1: Logout
    cy.then(() => {
      journeyHelpers.logoutUser();
    });

    // USER 2: Register with different email
    const user2Email = `user2-delete-${Date.now()}@example.com`;
    const user2Password = 'SecurePassword123';
    journeyHelpers.registerUser(user2Email, user2Password);

    // USER 2: Try to access User1's recipe detail and verify no delete button
    cy.then(() => {
      cy.visit(`http://localhost:3000/recipes/${recipeId}`);
      cy.contains('Delete Recipe').should('not.exist');
    });
  });
});
