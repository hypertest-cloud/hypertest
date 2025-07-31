process.env.HOME = '/tmp';

import chromium from '@sparticuz/chromium';
import type { Context } from 'aws-lambda';
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';
import { uploadToS3 } from './utils/uploadToS3.js';

interface EventContext {
  grep?: string;
}

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

async function main(testId: string, bucketName: string, grep?: string) {
  const testRunDir = `/tmp/${testId}`;
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

  // Build the Playwright test command.
  const cmd = grep
    ? `HT_TEST_ARTIFACTS_OUTPUT_PATH=${testOutputDir} npx playwright test -c ${testRunDir}/_playwright.config.ts --grep "${grep}"`
    : `HT_TEST_ARTIFACTS_OUTPUT_PATH=${testOutputDir} npx playwright test -c ${testRunDir}/_playwright.config.ts`;

  // Ensure the ffmpeg cache directory exists and create a symlink
  // to the system ffmpeg binary. This is necessary for Playwright
  // to handle video recording. The directory structure is based on
  // Playwright's architecture. The symlink points to the system's
  // ffmpeg binary.
  try {
    execSync('mkdir -p /tmp/.cache/ms-playwright/ffmpeg-1011', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log('Error creating directory for ffmpeg cache:', error);
  }

  try {
    execSync(
      'ln -s /usr/bin/ffmpeg /tmp/.cache/ms-playwright/ffmpeg-1011/ffmpeg-linux',
      {
        stdio: 'inherit',
        cwd: process.cwd(),
      },
    );
  } catch (error) {
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log('Error creating symlink for ffmpeg:', error);
  }

  // Run the Playwright test command.
  try {
    execSync(cmd, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log('main test run error:', error);
  }

  const uploadResult = await uploadToS3(bucketName, testOutputDir, testId);
  if (!uploadResult.success) {
    throw new Error('Failed to upload test results to S3.');
  }

  const report = JSON.parse(
    await fs.readFile(`${testOutputDir}/playwright-results.json`, 'utf8'),
  );

  return {
    expected: report.stats.expected,
    unexpected: report.stats.unexpected,
    testId,
    grep,
  };
}

const handler = async (
  event: { testId: string; bucketName: string; context: EventContext },
  context: Context,
) => {
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log(event, context);

  try {
    return await main(event.testId, event.bucketName, event.context?.grep);
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
