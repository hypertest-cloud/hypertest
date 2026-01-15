import path from 'node:path';
import fs from 'node:fs/promises';
import inquirer from 'inquirer';
import {
  getConfigFromTemplate,
  type TemplateProperties,
} from './getConfigFromTemplate.js';

const CONFIG_FILENAME = 'hypertest.config.js';

interface Question {
  type: 'number' | 'input' | 'list';
  name: TemplateProperties;
  message: string;
  default?: unknown;
  choices?: string[];
}

const QUESTIONS: Question[] = [
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
    name: 'awsCloudFunctionProvider_region',
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

  const promptAnswers: Record<TemplateProperties, unknown> =
    await inquirer.prompt(QUESTIONS);

  fs.writeFile(configPath, getConfigFromTemplate(promptAnswers));

  console.log(`\n✅ File ${CONFIG_FILENAME} has been created!`);
  console.log(`Path: ${configPath}\n`);
};
