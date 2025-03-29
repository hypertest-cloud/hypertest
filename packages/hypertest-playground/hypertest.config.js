// @ts-check
import { defineConfig } from '@hypertest/hypertest-core';
import { plugin } from '@hypertest/hypertest-plugin-playwright';
import { plugin as cloudPlugin } from '@hypertest/hypertest-provider-cloud-aws';

/**
 * @type {import("@hypertest/hypertest-types").HypertestConfig}
 */
const config = {};

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  imageName: 'hypertest/dev2',
  localImageName: 'local-test-image/tests',
  cloudProvider: {
    type: 'aws',
    ecrRegistry: '302735620058.dkr.ecr.eu-central-1.amazonaws.com',
  },
  plugins: {
    testPlugin: plugin({}),
    cloudPlugin: cloudPlugin({
      type: 'aws',
      ecrRegistry: '302735620058.dkr.ecr.eu-central-1.amazonaws.com',
    }),
  },
});
