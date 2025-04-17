process.env.HOME = '/tmp';

import chromium from '@sparticuz/chromium';
import type { Context } from 'aws-lambda';
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';

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

async function main(uuid: string, grep?: string) {
  const outputDir = `/tmp/${uuid}`;

  await fs.mkdir(outputDir, { recursive: true });

  const opts = {
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  };

  await fs.writeFile(
    `${outputDir}/_playwright.config.ts`,
    printConfigTemplate(opts, outputDir),
  );

  // const cmd = './node_modules/.bin/playwright test -c /tmp/_playwright.config.ts';
  console.log(process.cwd());
  const cmd = grep
    ? `npx playwright test -c ${outputDir}/_playwright.config.ts --grep "${grep}"`
    : `npx playwright test -c ${outputDir}/_playwright.config.ts`;

  try {
    execSync(cmd, {
      stdio: 'inherit',
      cwd: process.cwd(),
    });
  } catch (error) {}

  const report = JSON.parse(
    await fs.readFile(`${outputDir}/playwright-results.json`, 'utf8'),
  );

  return {
    expected: report.stats.expected,
    unexpected: report.stats.unexpected,
    grep,
  };
}

const handler = async (
  event: { grep?: string; uuid: string },
  context: Context,
) => {
  console.log(event, context);

  try {
    return await main(event.uuid, event.grep);
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
