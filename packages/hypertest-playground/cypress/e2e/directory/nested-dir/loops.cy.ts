const { _ } = Cypress;

describe("nested directory with loops", () => {
  const objectData = {
    1: {
      data: "first",
    },
    2: {
      data: "second",
    },
    3: {
      data: "third",
    },
  };

  const arrayData = ["first", "second", "third"];

  _.forOwn(objectData, (value, key) => {
    it(`${value.data} test from forOwn loop ${key} (1-4s)`, () => {
      cy.waitRandom(1, 4);

      expect(true).to.equal(true);
    });
  });

  arrayData.forEach((data, index) => {
    it(`${data} test from forEach loop ${index} (0-5s)`, () => {
      cy.waitRandom(0, 5);

      expect(true).to.equal(true);
    });
  });
});
