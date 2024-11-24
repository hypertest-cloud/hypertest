import {
  HypertestPlugin,
  TestDescription,
} from "@hypertest/hypertest-core";
import { PlaywrightPluginOptions } from "./types.js";
import { getFileTestNames } from "./getFileTestNames.js";
import { getSpecFiles } from "./getSpecFiles.js";

const PLAYWRIGHT_DIRECTORY = 'tests'

export const Plugin = (options: PlaywrightPluginOptions): HypertestPlugin => ({
  getTestDescriptions: async () => new Promise<TestDescription[]>(async (resolve, reject) => {
    const specFiles = getSpecFiles(options.projectPath + '/' + PLAYWRIGHT_DIRECTORY);
    console.log('specFiles: ', specFiles)
    const result = await Promise.all(specFiles.map(async (specFile) => {
      const names = await getFileTestNames(specFile)

      return names.map((name) => ({
        directoryPath: specFile,
        contextPath: name.contextPath,
        testName: name.testName,
      }))
    }))


    resolve(result.flat())
  }),
});
