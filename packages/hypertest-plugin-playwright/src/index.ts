import {
  HypertestPlugin
} from "@hypertest/hypertest-core";
import { execSync, ExecSyncOptionsWithBufferEncoding } from "child_process";
import { getGrepString } from "./getGrepString.js";
import { getSpecFilePaths } from "./getSpecFilePaths.js";
import { getTestContextPaths } from "./getTestContextPaths.js";
import { PlaywrightCloudFunctionContext, PlaywrightPluginOptions } from "./types.js";

export const Plugin = (options: PlaywrightPluginOptions): HypertestPlugin<PlaywrightCloudFunctionContext> => ({
  getCloudFunctionContexts: async () => new Promise<PlaywrightCloudFunctionContext[]>(async (resolve, reject) => {
    const specFilePaths = getSpecFilePaths(options.playwrightConfig.testDirectory);

    const fileContexts = await Promise.all(specFilePaths.map(async (specFilePath) => {
      const testContextPaths = await getTestContextPaths(specFilePath)

      return testContextPaths.map((testContextPath) => ({
        grepString: getGrepString(options, specFilePath, testContextPath)
      }))
    }))

    resolve(fileContexts.flat())
  }),
  buildImage: async () => {
    try {
      const execOptions: ExecSyncOptionsWithBufferEncoding = {
        stdio: "inherit",
        // TODO: Handle project root path dynamically
        cwd: "/Users/marcinlesek/Projects/hypertest"
      }

      execSync(`docker build --platform linux/amd64 -t hypertest-image .`, execOptions);

      execSync(
        `docker tag hypertest-image:latest 302735620058.dkr.ecr.eu-central-1.amazonaws.com/hypertest/dev2:latest`,
        execOptions
      );
    } catch (error) {
      console.error("Error while building Docker image:", error);
    }

    return {
      name: '302735620058.dkr.ecr.eu-central-1.amazonaws.com/hypertest/dev2:latest'
    }
  },
});
