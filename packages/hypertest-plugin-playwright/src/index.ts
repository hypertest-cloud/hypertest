import {
  HypertestPlugin
} from "@hypertest/hypertest-core";
import { getGrepString } from "./getGrepString.js";
import { getSpecFilePaths } from "./getSpecFilePaths.js";
import { getTestContextPaths } from "./getTestContextPaths.js";
import { PlaywrightPluginOptions } from "./types.js";

// TODO: Import dynamically from `playwright.config.ts`
const PLAYWRIGHT_DIRECTORY = 'playwright/tests'
const PLAYWRIGHT_PROJECT_NAME = 'chromium'

export const Plugin = (options: PlaywrightPluginOptions): HypertestPlugin<{}> => ({
  getLambdaContexts: async () => new Promise<{}[]>(async (resolve, reject) => {
    const specFilePaths = getSpecFilePaths(PLAYWRIGHT_DIRECTORY);
    const result = await Promise.all(specFilePaths.map(async (specFilePath) => {
      const testContextPaths = await getTestContextPaths(specFilePath)

      return testContextPaths.map((testContextPath) => ({
        grepString: getGrepString(PLAYWRIGHT_DIRECTORY, PLAYWRIGHT_PROJECT_NAME, specFilePath, testContextPath)
      }))
    }))

    resolve(result.flat())
  }),
  getLambda: async (): Promise<void> => {},
});
