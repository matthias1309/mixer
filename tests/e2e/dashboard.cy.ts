describe('Dashboard', () => {
  beforeEach(() => {
    // Login first
    cy.visit('http://localhost:3000/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('SecurePassword123');
    cy.get('button[type="submit"]').click();

    // Navigate to dashboard
    cy.url().should('include', '/dashboard');
  });

  it('should display recipe list', () => {
    cy.contains('Recipe Dashboard').should('be.visible');
    cy.contains('recipes found').should('be.visible');
  });

  it('should show create recipe button', () => {
    cy.contains('Create Recipe').should('be.visible');
  });

  it('should navigate to recipe detail when clicking recipe card', () => {
    // Assuming recipes exist
    cy.get('[class*="rounded-lg"]').first().click();
    cy.url().should('match', /\/recipes\/\d+$/);
  });

  it('should paginate recipes', () => {
    // If multiple pages exist
    const nextButton = cy.contains('button', 'Next');
    nextButton.should('exist');
  });
});
