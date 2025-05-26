import path from 'node:path';
import { Dockerfile } from '@hypertest/hypertest-playwright-container';
import type {
  ResolvedHypertestConfig,
  TestRunnerPlugin,
  TestRunnerPluginDefinition,
} from '@hypertest/hypertest-types';
import type { PlaywrightTestConfig } from '@playwright/test';
import { z } from 'zod';
import type winston from 'winston';
import { buildDockerImage } from './docker-build.js';
import { getGrepString } from './getGrepString.js';
import { getSpecFilePaths } from './getSpecFilePaths.js';
import { getTestContextPaths } from './getTestContextPaths.js';
import type {
  PlaywrightCloudFunctionContext,
  PlaywrightPluginOptions,
} from './types.js';

const getPlaywrightConfig = async (
  logger: winston.Logger,
): Promise<{
  playwrightConfigFilepath: string;
  config: PlaywrightTestConfig;
}> => {
  const configFilepath = './playwright.config.js';
  logger.verbose(`Loading PW config from: ${configFilepath}`);

  return {
    playwrightConfigFilepath: configFilepath,
    config: await import(path.resolve(process.cwd(), configFilepath)).then(
      (mod) => mod.default,
    ),
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

export const PlaywrightRunnerPlugin = (options: {
  options: PlaywrightPluginOptions;
  config: ResolvedHypertestConfig;
  dryRun?: boolean;
}): TestRunnerPlugin<PlaywrightCloudFunctionContext> => {
  return {
    getCloudFunctionContexts: async () => {
      const { config: pwConfig } = await getPlaywrightConfig(
        options.config.logger,
      );
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

      return fileContexts
        .flat()
        .map((context) => ({ uuid: crypto.randomUUID(), context }));
    },
    buildImage: async () => {
      const { config: pwConfig, playwrightConfigFilepath } =
        await getPlaywrightConfig(options.config.logger);
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
            PLAYWRIGHT_CONFIG_FILEPATH: playwrightConfigFilepath,
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
  };
};

const OptionsSchema = z.object({
  baseImage: z.string().optional(),
});

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
      options,
      dryRun,
    }),
});

export const playwright = plugin;

// biome-ignore lint/style/noDefaultExport: <explanation>
export default plugin;
