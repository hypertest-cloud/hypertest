describe("inside directory", () => {
  describe("nested describe 1", () => {
    it("inside dir test 1 (2-5s)", () => {
      cy.waitRandom(2, 5);

      expect(true).to.equal(true);
    });

    it("inside dir test 2 (2s)", () => {
      cy.wait(2000);

      expect(true).to.equal(true);
    });

    it("inside dir test 3 (3-8s)", () => {
      cy.waitRandom(3, 8);

      expect(true).to.equal(true);
    });
  });

  it("inside dir test 4 (2s)", () => {
    cy.wait(2000);

    expect(true).to.equal(true);
  });

  it("inside dir test 5 (1-5s)", () => {
    cy.waitRandom(1, 5);

    expect(true).to.equal(true);
  });
});
