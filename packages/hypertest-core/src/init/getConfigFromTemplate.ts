export type TemplateProperties =
  | 'concurrency'
  | 'imageName'
  | 'localImageName'
  | 'localBaseImageName'
  | 'testRunnerOption'
  | 'awsCloudFunctionProvider_baseImage'
  | 'awsCloudFunctionProvider_region'
  | 'awsCloudFunctionProvider_ecrRegistry'
  | 'awsCloudFunctionProvider_functionName'
  | 'awsCloudFunctionProvider_bucketName';

export const getConfigFromTemplate = (
  props: Record<TemplateProperties, unknown>,
) => {
  const {
    concurrency,
    imageName,
    localImageName,
    localBaseImageName,
    testRunnerOption,
    awsCloudFunctionProvider_baseImage,
    awsCloudFunctionProvider_region,
    awsCloudFunctionProvider_ecrRegistry,
    awsCloudFunctionProvider_functionName,
    awsCloudFunctionProvider_bucketName,
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
  cloudFunctionProvider: aws({
    baseImage:
      '${awsCloudFunctionProvider_baseImage}',
    region: '${awsCloudFunctionProvider_region}',
    ecrRegistry: '${awsCloudFunctionProvider_ecrRegistry}',
    functionName: '${awsCloudFunctionProvider_functionName}',
    bucketName: '${awsCloudFunctionProvider_bucketName}',
  }),
});
`;
};
