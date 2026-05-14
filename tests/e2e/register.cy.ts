describe('Registration Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/register');
  });

  it('should display register form', () => {
    cy.contains('Create Account').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('have.length', 2);
  });

  it('should show error for missing fields', () => {
    cy.get('button[type="submit"]').click();
    cy.contains('All fields are required').should('be.visible');
  });

  it('should show error for invalid email', () => {
    cy.get('input[type="email"]').type('not-an-email');
    cy.get('input[type="password"]').first().type('Password123');
    cy.get('input[type="password"]').last().type('Password123');
    cy.get('button[type="submit"]').click();
    cy.contains('Invalid email format').should('be.visible');
  });

  it('should show error for short password', () => {
    cy.get('input[type="email"]').type('user@example.com');
    cy.get('input[type="password"]').first().type('short');
    cy.get('input[type="password"]').last().type('short');
    cy.get('button[type="submit"]').click();
    cy.contains('at least 8 characters').should('be.visible');
  });

  it('should show error for mismatched passwords', () => {
    cy.get('input[type="email"]').type('user@example.com');
    cy.get('input[type="password"]').first().type('Password123');
    cy.get('input[type="password"]').last().type('Password456');
    cy.get('button[type="submit"]').click();
    cy.contains('Passwords do not match').should('be.visible');
  });

  it('should register successfully with valid input', () => {
    const uniqueEmail = `user-${Date.now()}@example.com`;
    cy.get('input[type="email"]').type(uniqueEmail);
    cy.get('input[type="password"]').first().type('ValidPassword123');
    cy.get('input[type="password"]').last().type('ValidPassword123');
    cy.get('button[type="submit"]').click();

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
  });

  it('should show login link', () => {
    cy.contains('Login here').should('have.attr', 'href', '/login');
  });
});
