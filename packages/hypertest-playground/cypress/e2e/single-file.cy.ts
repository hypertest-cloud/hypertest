describe("single file", () => {
  describe("nested describe 1", () => {
    it("single test 1 (0-3s)", () => {
      cy.waitRandom(0, 3);

      expect(true).to.equal(true);
    });

    it("single test 2 (1-4s)", () => {
      cy.waitRandom(1, 4);

      expect(true).to.equal(true);
    });

    it("single test 3 (3-8s)", () => {
      cy.waitRandom(3, 8);

      expect(true).to.equal(true);
    });

    it("single test 4 (5s)", () => {
      cy.wait(5000);

      expect(true).to.equal(true);
    });
  });

  describe("nested describe 2", () => {
    it("single test 5 (3s)", () => {
      cy.wait(3000);

      expect(true).to.equal(true);
    });

    it("single test 6 (5-10s)", () => {
      cy.waitRandom(5, 10);

      expect(true).to.equal(true);
    });
  });
});
