// @ts-check
import { defineConfig } from '@hypertest/hypertest-core';
import { plugin as testPlugin } from '@hypertest/hypertest-plugin-playwright';
import { plugin as cloudPlugin } from '@hypertest/hypertest-provider-cloud-aws';

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  imageName: 'hypertest/playground-playwright',
  localImageName: 'hypertest/playground-playwright',
  localBaseImageName: 'hypertest/local-base-playwright',
  plugins: {
    testPlugin: testPlugin({}),
    cloudPlugin: cloudPlugin({
      baseImage:
        '491085409730.dkr.ecr.eu-central-1.amazonaws.com/hypertest/base-playwright:latest',
      region: 'eu-central-1',
      ecrRegistry: '491085409730.dkr.ecr.eu-central-1.amazonaws.com',
      functionName: 'hypertest-playground-playwright',
      bucketName: 'hypertest-playground-playwright-artifacts',
    }),
  },
});
