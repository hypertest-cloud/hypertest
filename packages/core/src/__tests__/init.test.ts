import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import type { TemplateProperties } from '../init/getConfigFromTemplate.js';
import { collectInitAnswers, writeInitConfig } from '../init/init.js';

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

let tmpDir: string;
let origCwd: string;
let origIsTty: boolean | undefined;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hypertest-init-'));
  origCwd = process.cwd();
  origIsTty = process.stdin.isTTY;
});

afterEach(async () => {
  process.chdir(origCwd);
  Object.defineProperty(process.stdin, 'isTTY', {
    value: origIsTty,
    configurable: true,
  });
  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('collectInitAnswers non-TTY: returns defaults without prompting', async () => {
  Object.defineProperty(process.stdin, 'isTTY', {
    value: false,
    configurable: true,
  });
  const result = await collectInitAnswers();
  assert.equal(result.concurrency, 30);
  assert.equal(result.imageName, 'my-app/hypertest-playwright');
  assert.equal(result.awsCloudProvider_region, 'eu-central-1');
});

test('collectInitAnswers non-TTY: all 10 keys present', async () => {
  Object.defineProperty(process.stdin, 'isTTY', {
    value: false,
    configurable: true,
  });
  const result = await collectInitAnswers();
  assert.equal(Object.keys(result).length, 10);
  for (const key of Object.keys(DEFAULTS)) {
    assert.ok(key in result, `missing key: ${key}`);
  }
});

test('writeInitConfig: writes file to cwd/hypertest.config.js and returns its path', async () => {
  const realTmpDir = await fs.realpath(tmpDir);
  process.chdir(realTmpDir);
  const resultPath = await writeInitConfig(DEFAULTS);
  const expectedPath = path.resolve(realTmpDir, 'hypertest.config.js');
  assert.equal(resultPath, expectedPath);
  const stat = await fs.stat(expectedPath);
  assert.ok(stat.isFile(), 'hypertest.config.js should be a file');
});

test('writeInitConfig: content includes concurrency and imageName values', async () => {
  process.chdir(tmpDir);
  await writeInitConfig(DEFAULTS);
  const content = await fs.readFile(
    path.resolve(tmpDir, 'hypertest.config.js'),
    'utf-8',
  );
  assert.ok(
    content.includes('30'),
    `expected concurrency 30 in config: ${content}`,
  );
  assert.ok(
    content.includes('my-app/hypertest-playwright'),
    `expected imageName in config: ${content}`,
  );
});

test('writeInitConfig: content includes AWS region and bucket name', async () => {
  process.chdir(tmpDir);
  await writeInitConfig(DEFAULTS);
  const content = await fs.readFile(
    path.resolve(tmpDir, 'hypertest.config.js'),
    'utf-8',
  );
  assert.ok(
    content.includes('eu-central-1'),
    `expected region in config: ${content}`,
  );
  assert.ok(
    content.includes('hypertest-artifacts'),
    `expected bucketName in config: ${content}`,
  );
});
