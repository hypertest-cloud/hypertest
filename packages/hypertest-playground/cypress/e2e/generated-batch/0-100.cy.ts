describe("generated batch 0-100", () => {
  before(() => {
    cy.task("order:index:reset");
  });

  for (let i = 0; i < 10; i += 1) {
    it("single test (0-3s) ", () => {
      // Wait for a random amount of time between 0 and 3 seconds
      cy.waitRandom(0, 3);

      expect(true).to.equal(true);

      // Check the order index value and compare it to
      // the current iteration index
      cy.task("order:index:get").then((index) => {
        if (index !== i) {
          throw new Error(`Index mismatch! index: ${index}, i: ${i}`);
        }

        cy.task("log", `Index: ${index}, i: ${i}`);

        cy.task("order:index:increment");
      });
    });
  }
});
