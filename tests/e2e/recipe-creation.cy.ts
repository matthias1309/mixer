describe('Recipe Creation - Ingredient Autocomplete', () => {
  beforeEach(() => {
    cy.visit('/recipes/new');
  });

  it('should show autocomplete suggestions after 2 characters', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('to');
    cy.get('[role="listbox"]').should('be.visible');
  });

  it('should not show autocomplete for single character', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('t');
    cy.get('[role="listbox"]').should('not.exist');
  });

  it('should show "Neue Zutat erstellen" button when no matches', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('xyz123abc');
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="listbox"]').should('contain', 'Keine Zutaten gefunden');
    cy.get('[role="listbox"]').should('contain', 'Neue Zutat erstellen');
  });

  it('should close autocomplete when clicking outside', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('to');
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('body').click(0, 0);
    cy.get('[role="listbox"]').should('not.exist');
  });

  it('should close dropdown with Escape key', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('to');
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('input[placeholder="Zutatname"]').first().type('{esc}');
    cy.get('[role="listbox"]').should('not.exist');
  });
});

describe('Recipe Creation - Create Ingredient Modal', () => {
  beforeEach(() => {
    cy.visit('/recipes/new');
  });

  it('should open modal when clicking "Neue Zutat erstellen"', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('newingredient123');
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="listbox"]').contains('Neue Zutat erstellen').click();

    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').should('contain', 'Neue Zutat erstellen');
  });

  it('should pre-fill suggested name in modal', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('mynewthing');
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="listbox"]').contains('Neue Zutat erstellen').click();

    cy.get('[role="dialog"] input[placeholder="Zutat-Name (Deutsch)"]').should('have.value', 'mynewthing');
  });

  it('should close modal when clicking Cancel', () => {
    cy.get('input[placeholder="Zutatname"]').first().type('xyz');
    cy.get('[role="listbox"]').should('be.visible');
    cy.get('[role="listbox"]').contains('Neue Zutat erstellen').click();

    cy.get('[role="dialog"]').should('be.visible');
    cy.get('[role="dialog"]').contains('Abbrechen').click();
    cy.get('[role="dialog"]').should('not.exist');
  });
});
