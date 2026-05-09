// Cypress E2E support file
// Run on every test file before running tests

// Import commands
// import './commands';

// Hide fetch/XMLHttpRequest logs to reduce console noise
const app = window.top as Window;

if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML =
    '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');

  app.document.head.appendChild(style);
}
