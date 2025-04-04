// @ts-check
import { defineConfig } from '@hypertest/hypertest-core';
import { plugin as testPlugin } from '@hypertest/hypertest-plugin-playwright';
import { plugin as cloudPlugin } from '@hypertest/hypertest-provider-cloud-aws';

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  imageName: 'hypertest/dev2',
  localImageName: 'local-test-image/tests',
  plugins: {
    testPlugin: testPlugin({}),
    cloudPlugin: cloudPlugin({
      baseImage:
        '302735620058.dkr.ecr.eu-central-1.amazonaws.com/hypertest/hypertest-playwright:latest',
      region: 'eu-central-1',
      ecrRegistry: '302735620058.dkr.ecr.eu-central-1.amazonaws.com',
      functionName: 'hypertestDevHelloWorld2',
    }),
  },
});
