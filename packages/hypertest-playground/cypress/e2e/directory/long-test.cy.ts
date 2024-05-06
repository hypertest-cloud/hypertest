describe("long test", () => {
  it("long test 1 (12s)", () => {
    cy.wait(12000);

    expect(true).to.equal(true);
  });
});
