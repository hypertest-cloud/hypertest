process.env.HOME = '/tmp';

import chromium from '@sparticuz/chromium';
import type { Context } from 'aws-lambda';
import { execSync } from 'node:child_process';
import fs from 'node:fs/promises';

const printConfigTemplate = (json: Record<string, unknown>) => `
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
userConfig.reporter = [['json', { outputFile: '/tmp/playwright-results.json' }]];
console.log(userConfig);

export default userConfig;
`;

async function main(grep?: string) {
  const opts = {
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  };

  await fs.writeFile('/tmp/_playwright.config.ts', printConfigTemplate(opts));

  // const cmd = './node_modules/.bin/playwright test -c /tmp/_playwright.config.ts';
  console.log(process.cwd());
  const cmd = grep
    ? `npx playwright test -c /tmp/_playwright.config.ts --grep "${grep}"`
    : 'npx playwright test -c /tmp/_playwright.config.ts';
  execSync(cmd, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  const report = JSON.parse(
    await fs.readFile('/tmp/playwright-results.json', 'utf8'),
  );

  return {
    tests: report.results.summary.tests,
    passed: report.results.summary.passed,
  };
}

const handler = async (event: { grep: string }, context: Context) => {
  console.log(event, context);

  try {
    return await main(event.grep);
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
