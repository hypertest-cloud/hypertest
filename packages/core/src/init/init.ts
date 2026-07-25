import fs from 'node:fs/promises';
import path from 'node:path';
import { input, number, select } from '@inquirer/prompts';
import {
  type TemplateProperties,
  getConfigFromTemplate,
} from './getConfigFromTemplate.js';

const CONFIG_FILENAME = 'hypertest.config.js';

const DEFAULTS: Record<TemplateProperties, unknown> = {
  concurrency: 30,
  imageName: 'my-app/hypertest-playwright',
  localImageName: 'hypertest-playwright',
  localBaseImageName: 'hypertest-playwright-base',
  testRunnerOption: 'playwright',
  // biome-ignore lint/style/useNamingConvention: keys must match TemplateProperties type
  awsCloudProvider_region: 'eu-central-1',
  // biome-ignore lint/style/useNamingConvention: keys must match TemplateProperties type
  awsCloudProvider_ecrRegistry: '123456789.dkr.ecr.eu-central-1.amazonaws.com',
  // biome-ignore lint/style/useNamingConvention: keys must match TemplateProperties type
  awsCloudProvider_baseImage:
    '123456789.dkr.ecr.eu-central-1.amazonaws.com/hypertest/base-playwright:latest',
  // biome-ignore lint/style/useNamingConvention: keys must match TemplateProperties type
  awsCloudProvider_functionName: 'hypertest-playwright',
  // biome-ignore lint/style/useNamingConvention: keys must match TemplateProperties type
  awsCloudProvider_bucketName: 'hypertest-artifacts',
};

export const collectInitAnswers = async (): Promise<
  Record<TemplateProperties, unknown>
> => {
  if (!process.stdin.isTTY) {
    return DEFAULTS;
  }

  const concurrency =
    (await number({ message: 'Concurrency:', default: 30 })) ?? 30;
  const imageName = await input({
    message: 'Image name:',
    default: 'my-app/hypertest-playwright',
  });
  const localImageName = await input({
    message: 'Local image name:',
    default: 'hypertest-playwright',
  });
  const localBaseImageName = await input({
    message: 'Local base image name:',
    default: 'hypertest-playwright-base',
  });
  const testRunnerOption = await select({
    message: 'Test runner:',
    choices: [{ value: 'playwright' }],
  });
  // biome-ignore lint/style/useNamingConvention: variable name matches TemplateProperties key
  const awsCloudProvider_region = await input({
    message: 'AWS region:',
    default: 'eu-central-1',
  });
  // biome-ignore lint/style/useNamingConvention: variable name matches TemplateProperties key
  const awsCloudProvider_ecrRegistry = await input({
    message: 'ECR registry URL:',
    default: `123456789.dkr.ecr.${awsCloudProvider_region}.amazonaws.com`,
  });
  // biome-ignore lint/style/useNamingConvention: variable name matches TemplateProperties key
  const awsCloudProvider_baseImage = await input({
    message: 'Base image:',
    default: `${awsCloudProvider_ecrRegistry}/hypertest/base-playwright:latest`,
  });
  // biome-ignore lint/style/useNamingConvention: variable name matches TemplateProperties key
  const awsCloudProvider_functionName = await input({
    message: 'Lambda function name:',
    default: 'hypertest-playwright',
  });
  // biome-ignore lint/style/useNamingConvention: variable name matches TemplateProperties key
  const awsCloudProvider_bucketName = await input({
    message: 'S3 bucket name:',
    default: 'hypertest-artifacts',
  });

  return {
    concurrency,
    imageName,
    localImageName,
    localBaseImageName,
    testRunnerOption,
    awsCloudProvider_region,
    awsCloudProvider_ecrRegistry,
    awsCloudProvider_baseImage,
    awsCloudProvider_functionName,
    awsCloudProvider_bucketName,
  };
};

export const writeInitConfig = async (
  answers: Record<TemplateProperties, unknown>,
): Promise<string> => {
  const configPath = path.resolve(process.cwd(), CONFIG_FILENAME);
  await fs.writeFile(configPath, getConfigFromTemplate(answers));
  return configPath;
};
