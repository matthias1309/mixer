describe('Full User Flow', () => {
  it('should complete registration -> create recipe -> filter -> view', () => {
    // Register
    cy.visit('http://localhost:3000/register');
    const uniqueEmail = `flow-user-${Date.now()}@example.com`;

    cy.get('input[type="email"]').type(uniqueEmail);
    cy.get('input[type="password"]').first().type('ValidPassword123');
    cy.get('input[type="password"]').last().type('ValidPassword123');
    cy.get('button[type="submit"]').click();

    // Should be on dashboard
    cy.url().should('include', '/dashboard');

    // Create a recipe
    cy.contains('Create Recipe').click();
    cy.url().should('include', '/recipes/new');

    cy.get('input').first().type('My Test Recipe');
    cy.get('textarea').first().type('A delicious test recipe');
    cy.get('textarea').eq(1).type('1. Mix\n2. Cook\n3. Serve');
    cy.get('input[type="number"]').first().clear().type('2');

    cy.contains('Add Ingredient').click();
    cy.get('input[placeholder="Ingredient name"]').type('Tomato');
    cy.get('input[placeholder="Qty"]').type('2');

    cy.contains('Create Recipe').click();

    // Should be on recipe detail
    cy.url().should('match', /\/recipes\/\d+$/);
    cy.contains('My Test Recipe').should('be.visible');

    // Go back to dashboard
    cy.contains('Back to Dashboard').click();
    cy.url().should('include', '/dashboard');

    // Use filter
    cy.get('input[type="checkbox"]').first().click();

    // Verify filtering works
    cy.contains('recipes found').should('be.visible');
  });
});
