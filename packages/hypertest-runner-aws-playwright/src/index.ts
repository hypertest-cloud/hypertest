process.env.HOME = '/tmp';

import chromium from '@sparticuz/chromium';
import type { Context } from 'aws-lambda';
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { uploadToS3 } from './utils/uploadToS3.js';

const printConfigTemplate = (
  json: Record<string, unknown>,
  outputDir: string,
) => `
import path from 'node:path';
import userConfig from '/tests/playwright.config.js';

userConfig.projects?.forEach((p) => {
  if (!p.use) {
    p.use = {};
  }
  if (!p.use.launchOptions) {
    p.use.launchOptions = {};
  }
  p.use.launchOptions = {
    ...p.use.launchOptions,
    ...${JSON.stringify(json, null, 2)}
  };
});
userConfig.testDir = path.resolve('/tests', userConfig.testDir);
userConfig.reporter = [['json', { outputFile: '${outputDir}/playwright-results.json' }]];
userConfig.outputDir = '${outputDir}'
userConfig.workers = 1;
console.log(userConfig);

export default userConfig;
`;

async function main(uuid: string, bucketName: string, grep?: string) {
  const testRunDir = `/tmp/${uuid}`;
  const testOutputDir = `${testRunDir}/output`;

  await fs.mkdir(testOutputDir, { recursive: true });

  const opts = {
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  };

  await fs.writeFile(
    `${testRunDir}/_playwright.config.ts`,
    printConfigTemplate(opts, testOutputDir),
  );

  console.log('process.cwd()');
  console.log(process.cwd());
  const cmd = grep
    ? `HT_TEST_ARTIFACTS_PATH=${testRunDir} npx playwright test -c ${testRunDir}/_playwright.config.ts --grep "${grep}"`
    : `HT_TEST_ARTIFACTS_PATH=${testRunDir} npx playwright test -c ${testRunDir}/_playwright.config.ts`;

  console.log('Running command:', cmd);
  try {
    execSync(cmd, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    console.log('main test run error:', error);
  }

  // TODO: Remove all console logs and execSync's with debugs
  console.log(`ls -la ${testRunDir}/output`);
  try {
    execSync(`ls -la ${testRunDir}/output`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {}

  console.log(`ls -la ${testRunDir}/output/screenshots`);
  try {
    execSync(`ls -la ${testRunDir}/output/screenshots`, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {}

  const uploadResult = await uploadToS3(bucketName, testOutputDir, uuid);
  if (!uploadResult.success) {
    throw new Error('Failed to upload test results to S3.');
  }

  const report = JSON.parse(
    await fs.readFile(`${testOutputDir}/playwright-results.json`, 'utf8'),
  );

  return {
    expected: report.stats.expected,
    unexpected: report.stats.unexpected,
    uuid,
    grep,
  };
}

const handler = async (
  event: { uuid: string; bucketName: string; grep?: string },
  context: Context,
) => {
  console.log(event, context);

  try {
    return await main(event.uuid, event.bucketName, event.grep);
  } catch (err) {
    console.error(err);

    if (err instanceof Error) {
      return {
        status: 'error',
        message: err.message,
        stack: err.stack,
      };
    }
    return {
      status: 'unknown-error',
    };
  }
};

export { handler };
