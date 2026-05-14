describe('Recipe Filtering', () => {
  beforeEach(() => {
    // Login first
    cy.visit('http://localhost:3000/login');
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('SecurePassword123');
    cy.get('button[type="submit"]').click();

    // Navigate to dashboard
    cy.url().should('include', '/dashboard');
  });

  it('should display ingredient filter', () => {
    cy.contains('Filter by Ingredients').should('be.visible');
  });

  it('should display list of available ingredients', () => {
    // Check that ingredients are loaded and displayed
    cy.get('input[type="checkbox"]').should('have.length.greaterThan', 0);
  });

  it('should toggle ingredient selection', () => {
    // Select an ingredient
    cy.get('input[type="checkbox"]').first().click();
    cy.get('input[type="checkbox"]').first().should('be.checked');

    // Verify recipe list updates
    cy.contains('recipes found').should('be.visible');
  });

  it('should show selected ingredients as tags', () => {
    // Select an ingredient
    cy.get('input[type="checkbox"]').first().click();

    // Verify selected section appears
    cy.contains('Selected:').should('be.visible');

    // Verify tag is displayed
    cy.get('span').filter(':contains("×")').should('have.length.greaterThan', 0);
  });

  it('should remove ingredient from selection by clicking X button', () => {
    // Select an ingredient
    cy.get('input[type="checkbox"]').first().click();
    cy.get('input[type="checkbox"]').first().should('be.checked');

    // Click the X button to remove
    cy.get('button').filter(':contains("×")').first().click();

    // Verify checkbox is unchecked
    cy.get('input[type="checkbox"]').first().should('not.be.checked');

    // Verify Selected section disappears if no more selections
    cy.contains('Selected:').should('not.exist');
  });

  it('should clear all filters with clear button', () => {
    // Select multiple ingredients
    cy.get('input[type="checkbox"]').eq(0).click();
    cy.get('input[type="checkbox"]').eq(1).click();

    // Verify clear button is visible
    cy.contains('Clear filters').should('be.visible');

    // Click clear button
    cy.contains('Clear filters').click();

    // Verify checkboxes are unchecked
    cy.get('input[type="checkbox"]:checked').should('have.length', 0);

    // Verify clear button disappears
    cy.contains('Clear filters').should('not.exist');
  });

  it('should show fewer recipes when selecting ingredients (AND logic)', () => {
    // Get initial recipe count
    cy.contains(/\d+ recipes? found/).then(($el) => {
      const initialText = $el.text();
      const initialCount = parseInt(initialText.match(/\d+/)?.[0] || '0');

      // Select an ingredient
      cy.get('input[type="checkbox"]').first().click();

      // Recipe count should be <= initial count (AND logic)
      cy.contains(/\d+ recipes? found/).then(($el2) => {
        const filteredText = $el2.text();
        const filteredCount = parseInt(filteredText.match(/\d+/)?.[0] || '0');
        expect(filteredCount).to.be.lessThanOrEqual(initialCount);
      });
    });
  });

  it('should maintain selected filters when navigating between pages', () => {
    // Select an ingredient
    cy.get('input[type="checkbox"]').first().click();

    // Get the selected ingredient name
    cy.get('span').filter(':contains("×")').first().then(($tag) => {
      const selectedIngredient = $tag.text().replace('×', '').trim();

      // Navigate to next page if it exists
      const nextButton = cy.contains('button', 'Next');
      nextButton.should('exist').click({ force: true });

      // Verify the filter is still applied
      cy.contains('Selected:').should('be.visible');
      cy.contains(selectedIngredient).should('be.visible');
    });
  });
});
