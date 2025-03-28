import path from 'node:path';
import type { HypertestPlugin } from '@hypertest/hypertest-core';
import { getGrepString } from './getGrepString.js';
import { getSpecFilePaths } from './getSpecFilePaths.js';
import { getTestContextPaths } from './getTestContextPaths.js';
import type {
  PlaywrightCloudFunctionContext,
  PlaywrightPluginOptions,
} from './types.js';
import { runCommand } from './runCommand.js';
import type { PlaywrightTestConfig } from '@playwright/test';

const DEFAULT_BASE_IMAGE =
  '302735620058.dkr.ecr.eu-central-1.amazonaws.com/hypertest/hypertest-playwright:latest';

const getPlaywrightConfig = async (): Promise<{
  playwrightConfigFilepath: string;
  config: PlaywrightTestConfig;
}> => {
  const configFilepath = `${process.cwd()}/playwright.config.js`;
  console.log('Loading PW config from:', configFilepath);
  return {
    playwrightConfigFilepath: configFilepath,
    config: await import(configFilepath).then((mod) => mod.default),
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

export const Plugin = ({
  baseImage = DEFAULT_BASE_IMAGE,
  ...options
}: PlaywrightPluginOptions): HypertestPlugin<PlaywrightCloudFunctionContext> => {
  return {
    getCloudFunctionContexts: async () => {
      const { config: pwConfig } = await getPlaywrightConfig();
      const testDir = getTestDir(pwConfig);

      const specFilePaths = getSpecFilePaths(testDir);

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
            --build-arg BASE_IMAGE=${baseImage} \
            --build-arg TEST_DIR=${testDir} \
            --build-arg PLAYWRIGHT_CONFIG_FILEPATH=${playwrightConfigFilepath} \
            .
        `;
      };

      try {
        const cmd = getDockerBuildCommand();
        console.log(`\nRunning: ${cmd}\n`);

        runCommand(cmd);
        if (options.dryRun) {
          process.exit();
        }

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
