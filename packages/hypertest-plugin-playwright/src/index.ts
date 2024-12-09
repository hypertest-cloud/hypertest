import {
  HypertestPlugin
} from "@hypertest/hypertest-core";
import { getGrepString } from "./getGrepString.js";
import { getSpecFilePaths } from "./getSpecFilePaths.js";
import { getTestContextPaths } from "./getTestContextPaths.js";
import { PlaywrightPluginOptions } from "./types.js";

interface PlaywrightLambdaContext {
  grepString: string
}

export const Plugin = (options: PlaywrightPluginOptions): HypertestPlugin<PlaywrightLambdaContext> => ({
  getLambdaContexts: async () => new Promise<PlaywrightLambdaContext[]>(async (resolve, reject) => {
    const specFilePaths = getSpecFilePaths(options.playwrightConfig.testsDirectory);
    const fileContexts = await Promise.all(specFilePaths.map(async (specFilePath) => {
      const testContextPaths = await getTestContextPaths(specFilePath)

      return testContextPaths.map((testContextPath) => ({
        grepString: getGrepString(options, specFilePath, testContextPath)
      }))
    }))

    resolve(fileContexts.flat())
  }),
  getLambda: async (): Promise<void> => {},
});
