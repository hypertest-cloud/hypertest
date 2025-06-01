// @ts-check
import { defineConfig } from '@hypertest/hypertest-core';
import playwright from '@hypertest/hypertest-plugin-playwright';
import aws from '@hypertest/hypertest-provider-cloud-aws';

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  concurrency: 30,
  imageName: 'hypertest/playground-playwright',
  localImageName: 'hypertest/playground-playwright',
  localBaseImageName: 'hypertest/local-base-playwright',
  testRunner: playwright({}),
  cloudFunctionProvider: aws({
    baseImage:
      '491085409730.dkr.ecr.eu-central-1.amazonaws.com/hypertest/base-playwright:latest',
    region: 'eu-central-1',
    ecrRegistry: '491085409730.dkr.ecr.eu-central-1.amazonaws.com',
    functionName: 'hypertest-playground-playwright',
  }),
});
