import { Dockerfile } from '@hypertest/hypertest-playwright-container';
import type {
  ResolvedHypertestConfig,
  TestRunnerPlugin,
  TestRunnerPluginDefinition,
} from '@hypertest/hypertest-types';
import type { PlaywrightTestConfig } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type winston from 'winston';
import { z } from 'zod';
import { buildDockerImage } from './docker-build.js';
import { getGrepString } from './getGrepString.js';
import { getSpecFilePaths } from './getSpecFilePaths.js';
import { getTestContextPaths } from './getTestContextPaths.js';
import type { PlaywrightCloudFunctionContext } from './types.js';

const CONFIG_FILE_PATH = './playwright.config.js';

const getPlaywrightConfigFactory = (
  logger: winston.Logger,
): (() => Promise<PlaywrightTestConfig>) => {
  let pwConfig: PlaywrightTestConfig | null = null;

  return async () => {
    if (pwConfig) {
      return pwConfig;
    }

    logger.verbose(`Loading PW config from: ${CONFIG_FILE_PATH}`);
    const fileUrl = pathToFileURL(
      path.resolve(process.cwd(), CONFIG_FILE_PATH),
    ).href;

    pwConfig = await import(fileUrl).then((mod) => mod.default);

    if (pwConfig) {
      return pwConfig;
    }

    throw new Error(`Failed to load config from: ${CONFIG_FILE_PATH}`);
  };
};

const getProjectName = (config: PlaywrightTestConfig) => {
  const project = config.projects?.at(0);
  if (!project) {
    throw new Error('Playwright config has no project at index 0');
  }
  if (!project.name) {
    throw new Error(`Project name is required, got: ${project.name}`);
  }
  return project.name;
};

const getTestDir = (config: PlaywrightTestConfig) => {
  const testDir = config.testDir;
  if (!testDir) {
    throw new Error(`Test dir is required, got: ${testDir}`);
  }
  return testDir;
};

const PlaywrightRunnerPlugin = (options: {
  config: ResolvedHypertestConfig;
  dryRun?: boolean;
}): TestRunnerPlugin<PlaywrightCloudFunctionContext> => {
  const getPlaywrightConfig = getPlaywrightConfigFactory(options.config.logger);

  return {
    buildImage: async () => {
      const pwConfig = await getPlaywrightConfig();
      const testDir = getTestDir(pwConfig);
      const { localImageName, localBaseImageName } = options.config;

      try {
        await buildDockerImage({
          dockerfile: Dockerfile,
          contextDir: '.',
          platform: 'linux/amd64',
          imageTag: localImageName,
          buildArgs: {
            // biome-ignore lint/style/useNamingConvention: <explanation>
            BASE_IMAGE: localBaseImageName,
            // biome-ignore lint/style/useNamingConvention: <explanation>
            TEST_DIR: testDir,
            // biome-ignore lint/style/useNamingConvention: <explanation>
            PLAYWRIGHT_CONFIG_FILEPATH: CONFIG_FILE_PATH,
          },
          env: {},
        });
      } catch (error) {
        options.config.logger.error(
          `Error while building Docker image: ${error}`,
        );
        process.exit(1);
      }
    },
    getInvokePayloadContext: async () => {
      const pwConfig = await getPlaywrightConfig();
      const projectName = getProjectName(pwConfig);
      const testDir = getTestDir(pwConfig);
      options.config.logger.verbose(`Playwright tests directory: ${testDir}`);

      const specFilePaths = getSpecFilePaths(testDir);
      options.config.logger.verbose(
        `Playwright test spec file paths: ${specFilePaths.join(', ')}`,
      );

      const fileContexts = await Promise.all(
        specFilePaths.map(async (specFilePath) => {
          const testContextPaths = await getTestContextPaths(specFilePath);

          return testContextPaths.map((testContextPath) => ({
            grep: getGrepString(
              projectName,
              testDir,
              specFilePath,
              testContextPath,
            ),
          }));
        }),
      );

      return fileContexts.flat();
    },
    getTestDir: async () => {
      const pwConfig = await getPlaywrightConfig();

      return getTestDir(pwConfig);
    },
  };
};

const OptionsSchema = z.object({});

type Options = z.infer<typeof OptionsSchema>;

const plugin = (
  options: Options,
): TestRunnerPluginDefinition<PlaywrightCloudFunctionContext> => ({
  name: '@hypertest/hypertest-plugin-playwright',
  version: '0.0.1',
  validate: async () => {
    await OptionsSchema.parseAsync(options);
  },
  handler: (config, { dryRun }) =>
    PlaywrightRunnerPlugin({
      config,
      dryRun,
    }),
});

export const playwright = plugin;

// biome-ignore lint/style/noDefaultExport: <explanation>
export default plugin;
