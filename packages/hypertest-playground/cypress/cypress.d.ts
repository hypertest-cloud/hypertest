declare namespace Cypress {
  interface Chainable {
    waitRandom(min: number, max: number): void;
  }
}
