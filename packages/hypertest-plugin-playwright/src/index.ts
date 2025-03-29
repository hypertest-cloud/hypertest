import path from 'node:path';
import type {
  HypertestConfig,
  HypertestPlugin,
  HypertestProviderCloud,
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

const DEFAULT_BASE_IMAGE =
  '302735620058.dkr.ecr.eu-central-1.amazonaws.com/hypertest/hypertest-playwright:latest';

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
  cloudProvider: HypertestProviderCloud<PlaywrightCloudFunctionContext>;
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

      const getLocalImageName = () =>
        `hypertest-image/${options.config.localImageName ?? options.config.imageName}`;

      const dockerfileFilepath = path.resolve(
        import.meta.dirname,
        '../Dockerfile',
      );
      console.log(dockerfileFilepath);
      const getDockerBuildCommand = () => {
        return `
          docker build -f ${dockerfileFilepath} \
            --platform linux/amd64 \
            -t ${getLocalImageName()} \
            --build-arg BASE_IMAGE=${options.options.baseImage} \
            --build-arg TEST_DIR=${testDir} \
            --build-arg PLAYWRIGHT_CONFIG_FILEPATH=${playwrightConfigFilepath} \
            .
        `;
      };

      try {
        const cmd = getDockerBuildCommand();
        console.log(`\nRunning: ${cmd}\n`);

        if (options.dryRun) {
          process.exit();
        }
        runCommand(cmd);

        const targetName = options.cloudProvider.getTargetImageName();
        runCommand(`docker tag ${getLocalImageName()} ${targetName}`);

        return {
          name: targetName,
        };
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
  validate: async () => {
    await OptionsSchema.parseAsync(options);
  },
  handler: (
    config: HypertestConfig,
    cloudProvider: HypertestProviderCloud<PlaywrightCloudFunctionContext>,
    { dryRun },
  ) =>
    Plugin({
      config,
      cloudProvider,
      options,
      dryRun,
    }),
});
