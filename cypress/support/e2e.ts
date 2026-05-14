// Cypress support file for E2E tests
beforeEach(() => {
  // Clear local storage before each test
  localStorage.clear();
});

afterEach(() => {
  // Log any network errors
  cy.on('uncaught:exception', (err) => {
    if (err.message.includes('ResizeObserver')) {
      return false;
    }
  });
});
