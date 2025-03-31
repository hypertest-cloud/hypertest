import path from 'node:path';
import type {
  HypertestConfig,
  HypertestPlugin,
  ResolvedHypertestConfig,
  TestPlugin,
} from '@hypertest/hypertest-types';
import { getGrepString } from './getGrepString.js';
import { getSpecFilePaths } from './getSpecFilePaths.js';
import { getTestContextPaths } from './getTestContextPaths.js';
import type {
  PlaywrightCloudFunctionContext,
  PlaywrightPluginOptions,
} from './types.js';
import { runCommand } from './runCommand.js';
import type { PlaywrightTestConfig } from '@playwright/test';
import { z } from 'zod';

const getPlaywrightConfig = async (): Promise<{
  playwrightConfigFilepath: string;
  config: PlaywrightTestConfig;
}> => {
  const configFilepath = './playwright.config.js';
  console.log('Loading PW config from:', configFilepath);
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

export const Plugin = (options: {
  options: PlaywrightPluginOptions;
  config: HypertestConfig;
  dryRun?: boolean;
}): HypertestPlugin<PlaywrightCloudFunctionContext> => {
  return {
    getCloudFunctionContexts: async () => {
      const { config: pwConfig } = await getPlaywrightConfig();
      const testDir = getTestDir(pwConfig);
      console.log(testDir);

      const specFilePaths = getSpecFilePaths(testDir);
      console.log(specFilePaths);

      const fileContexts = await Promise.all(
        specFilePaths.map(async (specFilePath) => {
          const testContextPaths = await getTestContextPaths(specFilePath);

          return testContextPaths.map((testContextPath) => ({
            grepString: getGrepString(
              getProjectName(pwConfig),
              // TODO: Probably remove this argument to fix grep paths?
              testDir,
              specFilePath,
              testContextPath,
            ),
          }));
        }),
      );

      return fileContexts.flat();
    },
    buildImage: async () => {
      const { config: pwConfig, playwrightConfigFilepath } =
        await getPlaywrightConfig();
      const testDir = getTestDir(pwConfig);
      const { localImageName } = options.config;

      try {
        const dockerfileFilepath = path.resolve(
          import.meta.dirname,
          '../Dockerfile',
        );
        console.log(dockerfileFilepath);

        const dockerBuildCommand = `
          docker build -f ${dockerfileFilepath} \
            --platform linux/amd64 \
            -t ${localImageName} \
            --build-arg BASE_IMAGE=hypertest-local/hypertest-playwright \
            --build-arg TEST_DIR=${testDir} \
            --build-arg PLAYWRIGHT_CONFIG_FILEPATH=${playwrightConfigFilepath} \
            .
        `;

        console.log(`\nRunning: ${dockerBuildCommand}\n`);
        runCommand(dockerBuildCommand);
      } catch (error) {
        console.error('Error while building Docker image:', error);
        process.exit(1);
      }
    },
  };
};

const OptionsSchema = z.object({
  baseImage: z.string().optional(),
});

type Options = z.infer<typeof OptionsSchema>;

export const plugin = (options: Options): TestPlugin => ({
  name: '@hypertest/hypertest-plugin-playwright',
  version: '0.0.1',
  validate: async () => {
    await OptionsSchema.parseAsync(options);
  },
  handler: (config: ResolvedHypertestConfig, { dryRun }) =>
    Plugin({
      config,
      options,
      dryRun,
    }),
});
