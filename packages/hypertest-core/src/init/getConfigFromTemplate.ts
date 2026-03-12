export type TemplateProperties =
  | 'concurrency'
  | 'imageName'
  | 'localImageName'
  | 'localBaseImageName'
  | 'testRunnerOption'
  | 'awsCloudProvider_baseImage'
  | 'awsCloudProvider_region'
  | 'awsCloudProvider_ecrRegistry'
  | 'awsCloudProvider_functionName'
  | 'awsCloudProvider_bucketName';

export const getConfigFromTemplate = (
  props: Record<TemplateProperties, unknown>,
) => {
  const {
    concurrency,
    imageName,
    localImageName,
    localBaseImageName,
    testRunnerOption,
    awsCloudProvider_baseImage,
    awsCloudProvider_region,
    awsCloudProvider_ecrRegistry,
    awsCloudProvider_functionName,
    awsCloudProvider_bucketName,
  } = props;

  return `
// @ts-check
import { defineConfig } from '@hypertest/hypertest-core';
import playwright from '@hypertest/hypertest-plugin-playwright';
import aws from '@hypertest/hypertest-provider-cloud-aws';

// biome-ignore lint/style/noDefaultExport: <explanation>
export default defineConfig({
  concurrency: ${concurrency},
  imageName: '${imageName}',
  localImageName: '${localImageName}',
  localBaseImageName: '${localBaseImageName}',
  testRunner: ${testRunnerOption ? 'playwright({})' : 'To handle in the future'},
  cloudProvider: aws({
    baseImage:
      '${awsCloudProvider_baseImage}',
    region: '${awsCloudProvider_region}',
    ecrRegistry: '${awsCloudProvider_ecrRegistry}',
    functionName: '${awsCloudProvider_functionName}',
    bucketName: '${awsCloudProvider_bucketName}',
  }),
});
`;
};
