import {
  HypertestPlugin,
} from "@hypertest/hypertest-core";
import { exec } from 'child_process';
import cypress from 'cypress'

export const Plugin = (options: {}): HypertestPlugin => ({
  getTestCount: async () => {
    const dd = exec('npx cypress run --headless', {
      cwd: 'C://Praca//hypertest//packages//hypertest-playground'
    }, (error, stdout, stderr) => {
      console.log('asd')
      if (error) {
        console.error(`Error executing ${error}`);
        return;
      }
      if (stderr) {
        console.error(`Error output from`, stderr);
        return;
      }
      console.log(`Output from: ${stdout}`);
    })

    return 0;
  },
});
