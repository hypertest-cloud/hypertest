const hypertestStorage = {
  testIndex: 1,
  testsCounter: 0
}

const originalIt = it;

const customIt = (param1, callback) => {
  hypertestStorage.testsCounter = hypertestStorage.testsCounter + 1;

  originalIt('HypertestIndexUpdate', async () => {
    await cy.task('loguj', hypertestStorage.testsCounter - 1)
    await cy.task('setMyVar', hypertestStorage.testsCounter)
  })

  if (hypertestStorage.testIndex === hypertestStorage.testsCounter - 1) {
    return originalIt(param1, callback)
  }
};

customIt.skip = () => {}
it = customIt

originalIt('HypertestFileInit', () => {
  cy.task('getMyVar').then((myVar) => {
    cy.task('loguj', 'File initialization value:' + myVar)
    hypertestStorage.testsCounter = myVar
  })
})


/// <reference types="cypress" />

context('Aliasing', () => {
  beforeEach(() => {
    cy.visit('https://example.cypress.io/commands/aliasing')
  })

  it('.as() - alias a DOM element for later use', () => {
    // https://on.cypress.io/as

    // Alias a DOM element for use later
    // We don't have to traverse to the element
    // later in our code, we reference it with @

    cy.get('.as-table').find('tbody>tr')
      .first().find('td').first()
      .find('button').as('firstBtn')

    // when we reference the alias, we place an
    // @ in front of its name
    cy.get('@firstBtn').click()

    cy.get('@firstBtn')
      .should('have.class', 'btn-success')
      .and('contain', 'Changed')
  })

  it('.as() - alias a route for later use', () => {
    // Alias the route to wait for its response
    cy.intercept('GET', '**/comments/*').as('getComment')

    // we have code that gets a comment when
    // the button is clicked in scripts.js
    cy.get('.network-btn').click()

    // https://on.cypress.io/wait
    cy.wait('@getComment').its('response.statusCode').should('eq', 200)
  })
})
