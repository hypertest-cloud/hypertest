import { exec } from 'child_process';
import { overrideItCallback, spawnServer } from "@hypertest/hypertest-runner-cypress";

const projectPath = process.env.TEST_PROJECT_PATH
if (!projectPath) {
  throw new Error('Variable TEST_PROJECT_PATH is missing.')
}

const server = spawnServer()

// overrideItCallback({
//   projectPath
// })

// exec("$env:TEST_INDEX = '2'; npx cypress run --headless", { cwd: projectPath }, async (error, stdout) => {
//   if (error) {
//     const errorMessage = `Error executing: ${error}`

//     console.error('errorMessage', errorMessage);
//     console.log('stdout:', stdout.toString())
//     return
//   }

//   console.log('stdout:', stdout.toString())
// })
