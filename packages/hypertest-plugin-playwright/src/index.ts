import { HypertestConfig, HypertestPlugin } from '@hypertest/hypertest-core';
import { execSync, ExecSyncOptionsWithBufferEncoding } from 'child_process';
import { getGrepString } from './getGrepString.js';
import { getSpecFilePaths } from './getSpecFilePaths.js';
import { getTestContextPaths } from './getTestContextPaths.js';
import {
  PlaywrightCloudFunctionContext,
  PlaywrightPluginOptions,
} from './types.js';
import fs from 'fs/promises';

const DOCKERFILE = (config: HypertestConfig) => `
FROM hypertest-playwright:latest
WORKDIR /tests
# COPY package.json package.json
RUN echo "{}" > package.json
RUN npm i @playwright/test
COPY ./playwright.config.ts /tests/playwright.config.ts
COPY ${config.testsPath} ${config.testsPath}
# RUN node /function/packages/hypertest-runner-playwright/dist/bin.js
`;

export const Plugin = (
  options: PlaywrightPluginOptions,
): HypertestPlugin<PlaywrightCloudFunctionContext> => ({
  getCloudFunctionContexts: async () =>
    new Promise<PlaywrightCloudFunctionContext[]>(async (resolve, reject) => {
      const specFilePaths = getSpecFilePaths(
        options.playwrightConfig.testDirectory,
      );

      const fileContexts = await Promise.all(
        specFilePaths.map(async (specFilePath) => {
          const testContextPaths = await getTestContextPaths(specFilePath);

          return testContextPaths.map((testContextPath) => ({
            grepString: getGrepString(options, specFilePath, testContextPath),
          }));
        }),
      );

      resolve(fileContexts.flat());
    }),
  buildImage: async () => {
    try {
      const execOptions: ExecSyncOptionsWithBufferEncoding = {
        stdio: 'inherit',
        cwd: process.cwd(),
      };

      console.log(
        'Creating Dockerfile for user project based on hypertest.config.ts...',
      );
      await fs.mkdir('.hypertest/', {
        recursive: true,
      });
      const config = await import(`${process.cwd()}/hypertest.config.js`).then(
        (mod) => mod.default,
      );
      console.log('config:', config);
      await fs.writeFile('.hypertest/Dockerfile', DOCKERFILE(config), 'utf-8');
      console.log('Created .hypertest/Dockerfile');

      const tag = process.env.ARM ? 'arm64' : 'amd64';
      const cmd = `docker build -f .hypertest/Dockerfile ${process.env.ARM ? '--platform linux/arm64 ' : '--platform linux/amd64 '}-t hypertest-image:${tag} .`;
      console.log(`\nRunning: ${cmd}\n`);

      execSync(cmd, execOptions);
      if (process.env.DRY_RUN !== undefined) {
        process.exit();
      }
      execSync(
        `docker tag hypertest-image:${tag} 302735620058.dkr.ecr.eu-central-1.amazonaws.com/hypertest/dev2:${tag}`,
        execOptions,
      );

      return {
        name: `302735620058.dkr.ecr.eu-central-1.amazonaws.com/hypertest/dev2:${tag}`,
      };
    } catch (error) {
      console.error('Error while building Docker image:', error);
      process.exit(1);
    }
  },
});
