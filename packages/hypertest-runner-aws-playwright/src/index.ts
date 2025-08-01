process.env.HOME = '/tmp';

import chromium from '@sparticuz/chromium';
import type { Context } from 'aws-lambda';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import { uploadToS3 } from './utils/uploadToS3.js';

interface EventContext {
  grep: string;
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

async function main(
  runId: string,
  testId: string,
  bucketName: string,
  grep: string,
) {
  const testRunDir = `/tmp/${runId}/${testId}`;
  const testOutputDir = `${testRunDir}/output`;

  // ffmpeg
  const ffmpegSourcePath = '/usr/bin/ffmpeg';
  const ffmpegTargetPath = '/tmp/.cache/ms-playwright/ffmpeg-1011/ffmpeg-linux';

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
  const cmd = `HT_TEST_ARTIFACTS_OUTPUT_PATH=${testOutputDir} npx playwright test -c ${testRunDir}/_playwright.config.ts --grep "${grep}"`;

  // Ensure the ffmpeg cache directory exists.
  try {
    execSync('mkdir -p /tmp/.cache/ms-playwright/ffmpeg-1011', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log('Error creating directory for ffmpeg cache:', error);
  }

  // Check if ffmpeg symlink exists, if not create a symlink
  // to the system ffmpeg binary. This is necessary for Playwright
  // to handle video recording. The directory structure is based on
  // Playwright's architecture. The symlink points to the system's
  // ffmpeg binary.
  try {
    if (existsSync(ffmpegTargetPath)) {
      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log(`ffmpeg symlink already exists: ${ffmpegTargetPath}`);
    } else {
      execSync(`ln -s ${ffmpegSourcePath} ${ffmpegTargetPath}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      // biome-ignore lint/suspicious/noConsoleLog: <explanation>
      console.log(
        `ffmpeg symlink created: ${ffmpegTargetPath} -> ${ffmpegSourcePath}`,
      );
    }
  } catch (error) {
    // biome-ignore lint/suspicious/noConsoleLog: <explanation>
    console.log('Error creating ffmpeg symlink:', error);
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

  const uploadResult = await uploadToS3(
    bucketName,
    testOutputDir,
    runId,
    testId,
  );
  if (!uploadResult.success) {
    throw new Error('Failed to upload test results to S3.');
  }

  const report = JSON.parse(
    await fs.readFile(`${testOutputDir}/playwright-results.json`, 'utf8'),
  );

  return {
    expected: report.stats.expected,
    unexpected: report.stats.unexpected,
    runId,
    testId,
    grep,
  };
}

const handler = async (
  event: {
    runId: string;
    testId: string;
    bucketName: string;
    context: EventContext;
  },
  context: Context,
) => {
  // biome-ignore lint/suspicious/noConsoleLog: <explanation>
  console.log(event, context);

  try {
    return await main(
      event.runId,
      event.testId,
      event.bucketName,
      event.context.grep,
    );
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
