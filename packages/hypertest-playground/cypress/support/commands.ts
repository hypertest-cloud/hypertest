/// <reference types="cypress" />
// ***********************************************

declare namespace Cypress {
  interface Chainable {
    waitRandom(min: number, max: number): void;
  }
}

Cypress.Commands.add("waitRandom", (min: number, max: number) => {
  cy.wait(Math.floor(Math.random() * (max - min + 1) + min) * 1000);
});
