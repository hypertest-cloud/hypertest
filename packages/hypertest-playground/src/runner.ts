import { exec } from 'child_process';
import { overrideItCallback } from "@hypertest/hypertest-runner-cypress";

const projectPath = process.env.TEST_PROJECT_PATH
if (!projectPath) {
  throw new Error('Variable TEST_PROJECT_PATH is missing.')
}

overrideItCallback({
  projectPath
})

exec('npx cypress run --headless', { cwd: projectPath }, async (error, stdout) => {
  if (error) {
    const errorMessage = `Error executing: ${error}`

    console.error(errorMessage);
    return
  }

  console.log('stdout:', stdout.toString())
})
