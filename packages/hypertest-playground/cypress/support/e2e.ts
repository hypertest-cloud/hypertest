// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

const store = { testsCount: 0 }

// Cypress.on('test:before:run', (attributes, test) => {
//   store.testsCount++
//   test.skip();
// });


// Cypress.on('test:after:run', (attributes, test) => {
//   console.log('test:after:run')
//   cy.task('log', `Tests count:${store.testsCount}`)
// });

// const store = { testsCount: 0 }

// beforeEach(() => {
//   cy.task('log', `Tests count:${store.testsCount}`)
// })

const originalIt = it;

// Override the it function to always skip tests
//@ts-ignore
it = (...args) => {
  // Increment the test count or perform any other desired action
  store.testsCount++; // Assuming you have a store object to keep track of the test count

  // Call the original it function with the same arguments, but mark the test as skipped
  //@ts-ignore
  return false
};

originalIt('testt', () => {
  cy.task('log', `Tests count: ${store.testsCount}`)
})
