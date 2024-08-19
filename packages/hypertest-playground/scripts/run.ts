import cypress from "cypress";

// Default script configuration values
let specFilePath = "cypress/e2e/generated-batch/0-100.cy.ts";
let numberOfRuns = 1;

// Check for `--spec` flag
const specArgIndex = process.argv.indexOf("--spec");

// Verify if --spec flag was provided with value,
// and if yes, get the value as spec path file
if (specArgIndex !== -1 && process.argv[specArgIndex + 1]) {
  specFilePath = process.argv[specArgIndex + 1];
}

// Check for `--times` flag
const timesArgIndex = process.argv.indexOf("--times");

// Verify if --times flag was provided with value,
// and if yes, get the value, parse as int and save as
// number of runs
if (timesArgIndex !== -1 && process.argv[timesArgIndex + 1]) {
  numberOfRuns = parseInt(process.argv[timesArgIndex + 1], 10);
}

async function run() {
  try {
    // Define options for cypress.run
    const runOptions = {
      spec: specFilePath,
      headless: true,
    };

    // Run Cypress with the specified options
    const results = await cypress.run(runOptions);

    // Log results
    console.log("Results object:", results);
  } catch (error) {
    console.error("Error running Cypress tests:", error);

    // Exit with an error code if there is an exception
    process.exit(1);
  }
}

// Execute the run function the specified number of times
(async () => {
  for (let i = 0; i < numberOfRuns; i++) {
    console.log(`Running test iteration ${i + 1} out of ${numberOfRuns} runs.`);

    await run();
  }
})();
