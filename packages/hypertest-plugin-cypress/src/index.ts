import {
  HypertestPlugin,
} from "@hypertest/hypertest-core";
import { exec } from 'child_process';
import { overrideItCallback, removeItCallbackOverride } from "./replace-it-callback.js";
import { SKIPPED_TEST_COUNTER_MARK, TEST_COUNTER_MARK } from "./constant.js";
import { CypressPluginOptions } from "./types.js";

export const Plugin = (options: CypressPluginOptions): HypertestPlugin => ({
  // getTestCount: async () => new Promise(async (resolve, reject) => {
  //   await overrideItCallback(options)
  //   const execOptions = {
  //     cwd: options.projectPath
  //   }

  //   exec('npx cypress run --headless', execOptions, async (error, stdout, stderr) => {
  //     if (error) {
  //       const errorMessage = `Error executing: ${error}`

  //       console.error(errorMessage);
  //       reject(errorMessage);
  //     }

  //     const testsCount = stdout.split(TEST_COUNTER_MARK).length - 1
  //     const skippedTestsCount = stdout.split(SKIPPED_TEST_COUNTER_MARK).length - 1

  //     await removeItCallbackOverride(options)
  //     resolve(testsCount + skippedTestsCount)
  //   })
  // }),
  getTestDescriptions: async () => []
});
