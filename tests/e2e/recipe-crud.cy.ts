describe('Recipe CRUD', () => {
  beforeEach(() => {
    // Login
    cy.visit('http://localhost:3000/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('SecurePassword123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should create a new recipe', () => {
    cy.contains('Create Recipe').click();
    cy.url().should('include', '/recipes/new');

    cy.get('input').first().type('Test Recipe');
    cy.get('textarea').first().type('A test description');
    cy.get('textarea').eq(1).type('Mix and serve');

    cy.contains('Add Ingredient').click();
    cy.get('input[placeholder="Ingredient name"]').type('Test Ingredient');

    cy.contains('Create Recipe').click();
    cy.url().should('match', /\/recipes\/\d+$/);
    cy.contains('Test Recipe').should('be.visible');
  });

  it('should view recipe detail', () => {
    // Navigate to a recipe
    cy.visit('http://localhost:3000/dashboard');
    cy.get('[class*="rounded-lg"]').first().click();
    cy.url().should('match', /\/recipes\/\d+$/);
  });

  it('should edit a recipe', () => {
    // Navigate to a recipe created by user
    cy.visit('http://localhost:3000/dashboard');
    cy.get('[class*="rounded-lg"]').first().click();

    cy.contains('Edit').click();
    cy.url().should('include', '/edit');

    cy.get('input').first().clear().type('Updated Recipe Name');
    cy.contains('Update Recipe').click();

    cy.contains('Updated Recipe Name').should('be.visible');
  });

  it('should delete a recipe', () => {
    cy.visit('http://localhost:3000/dashboard');
    cy.get('[class*="rounded-lg"]').first().click();

    cy.contains('Delete').click();
    cy.on('window:confirm', () => true);

    cy.url().should('include', '/dashboard');
  });
});
