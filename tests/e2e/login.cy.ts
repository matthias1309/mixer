describe('Login Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000/login');
  });

  it('should display login form', () => {
    cy.contains('Login').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
  });

  it('should show error for missing fields', () => {
    cy.get('button[type="submit"]').click();
    cy.contains('Email and password are required').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.get('input[type="email"]').type('wrong@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.contains('Invalid email or password').should('be.visible');
  });

  it('should login successfully with valid credentials', () => {
    // Assuming test user exists from backend setup
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('SecurePassword123');
    cy.get('button[type="submit"]').click();

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should show register link', () => {
    cy.contains('Register here').should('have.attr', 'href', '/register');
  });
});
