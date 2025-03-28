process.env.HOME = '/tmp';

import { execSync } from 'node:child_process';
import chromium from '@sparticuz/chromium';
import fs from 'node:fs/promises';
import type { APIGatewayEvent, Context } from 'aws-lambda';

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
console.log(userConfig);

export default userConfig;
`;

async function main() {
  const opts = {
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  };

  await fs.writeFile('/tmp/_playwright.config.ts', printConfigTemplate(opts));

  // const cmd = './node_modules/.bin/playwright test -c /tmp/_playwright.config.ts';
  console.log(process.cwd());
  const cmd = 'npx playwright test -c /tmp/_playwright.config.ts';
  execSync(cmd, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
}

const handler = async (event: APIGatewayEvent, context: Context) => {
  console.log(event, context);
  console.log('Hello Im lambda handler', process.env);

  try {
    await main();
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

  return {
    status: 'ok',
  };
};

export { handler };
