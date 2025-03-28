// @ts-check

/**
 * @type {import("@hypertest/hypertest-core").HypertestConfig}
 */
const config = {
  imageName: 'hypertest/dev2',
  localImageName: 'local-test-image/tests',
  cloudProvider: {
    type: 'aws',
    ecrRegistry: '302735620058.dkr.ecr.eu-central-1.amazonaws.com',
  },
};

// biome-ignore lint/style/noDefaultExport: <explanation>
export default config;
