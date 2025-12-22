import path from 'node:path';
import fs from 'node:fs/promises';
import inquirer from 'inquirer';

const CONFIG_FILENAME = 'hypertest.config.js';

const QUESTIONS = [
  {
    type: 'number',
    name: 'concurrency',
    message: 'Set concurrency:',
    default: 30,
  },
  {
    type: 'input',
    name: 'imageName',
    message: 'Set image name:',
  },
  {
    type: 'input',
    name: 'localImageName',
    message: 'Set local image name:',
  },
  {
    type: 'input',
    name: 'localBaseImageName',
    message: 'Set local base image name:',
  },
  {
    type: 'list',
    name: 'testRunnerOption',
    message: 'What test runner you want to use:',
    choices: ['playwright'],
  },
  {
    type: 'input',
    name: 'awsCloudFunctionProvider_baseImage',
    message: 'Cloud function base image:',
  },
  {
    type: 'input',
    name: 'awscloudFunctionProvider_region',
    message: 'Cloud function region:',
    default: 'eu-central-1',
  },
  {
    type: 'input',
    name: 'awsCloudFunctionProvider_ecrRegistry',
    message: 'Cloud ECR registry URL:',
    default: 'dkr.ecr.eu-central-1.amazonaws.com',
  },
  {
    type: 'input',
    name: 'awsCloudFunctionProvider_functionName',
    message: 'Cloud function name:',
  },
  {
    type: 'input',
    name: 'awsCloudFunctionProvider_bucketName',
    message: 'Cloud storage bucket name:',
  },
];

export const initializeHypertestConfig = async () => {
  const configPath = path.resolve(process.cwd(), CONFIG_FILENAME);

  const {
    concurrency,
    imageName,
    localImageName,
    localBaseImageName,
    testRunnerOption,
    awscloudFunctionProvider_baseImage,
    awscloudFunctionProvider_region,
    awscloudFunctionProvider_ecrRegistry,
    awscloudFunctionProvider_functionName,
    awscloudFunctionProvider_bucketName,
  } = await inquirer.prompt(QUESTIONS);

  fs.writeFile(
    configPath,
    `
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
      '${awscloudFunctionProvider_baseImage}',
    region: '${awscloudFunctionProvider_region}',
    ecrRegistry: '${awscloudFunctionProvider_ecrRegistry}',
    functionName: '${awscloudFunctionProvider_functionName}',
    bucketName: '${awscloudFunctionProvider_bucketName}',
  }),
});
`,
  );

  console.log(`\n✅ File ${CONFIG_FILENAME} has been created!`);
  console.log(`Path: ${configPath}\n`);
};
