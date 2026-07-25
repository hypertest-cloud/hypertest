import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import type { Logger } from 'winston';
import type {
  CloudProviderPlugin,
  ResolvedHypertestConfig,
  TestRunnerPlugin,
} from '@hypertest-cloud/types';
import { createEventBus } from '../events.js';
import { HypertestCore } from '../index.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ht-core-test-'));
  await fs.writeFile(path.join(tmpDir, 'placeholder.ts'), '// test');
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

const makeLogger = () => {
  const calls: string[] = [];
  const logger = {
    info: (msg: string) => calls.push(msg),
    verbose: (msg: string) => calls.push(msg),
    warn: (msg: string) => calls.push(msg),
    silent: false,
  } as unknown as Logger;
  return { logger, calls };
};

const makeConfig = (logger: Logger): ResolvedHypertestConfig => ({
  imageName: 'test/image',
  localImageName: 'local-image',
  localBaseImageName: 'local-base',
  buildManifestFileName: 'manifest.json',
  resultsFileName: 'results.json',
  driftDetectionPolicy: 'warning',
  concurrency: 1,
  logger,
});

const makeCloudProvider = (): CloudProviderPlugin => ({
  pullBaseImage: async () => {},
  pushImage: async () => {},
  updateLambdaImage: async () => {},
  updateManifest: async () => {},
  invoke: async () => ({ success: true, name: 'test', filePath: 'test.spec.ts', duration: 100 }),
  pullManifest: async () => ({ imageDigest: 'sha256:abc', testDirHash: 'hash', invokePayloadContexts: [] }),
  uploadRunResult: async () => ({}),
});

const makeTestRunner = (testDir: string): TestRunnerPlugin<unknown> => ({
  getInvokePayloadContext: async () => [],
  getTestDir: async () => testDir,
  buildImage: async () => {},
});

test('deploy() calls logger.info for all 5 step messages', async () => {
  const { logger, calls } = makeLogger();
  const core = HypertestCore({
    config: makeConfig(logger),
    cloudProvider: makeCloudProvider(),
    testRunner: makeTestRunner(tmpDir),
    events: createEventBus(),
  });

  await core.deploy();

  assert.ok(calls.some(m => m.includes('Pulling base image')), `missing 'Pulling base image' in: ${calls}`);
  assert.ok(calls.some(m => m.includes('Building container image')), `missing 'Building container image' in: ${calls}`);
  assert.ok(calls.some(m => m.includes('Pushing image to the cloud')), `missing 'Pushing image to the cloud' in: ${calls}`);
  assert.ok(calls.some(m => m.includes('Building and storing manifest')), `missing 'Building and storing manifest' in: ${calls}`);
  assert.ok(calls.some(m => m.includes('Updating lambda image')), `missing 'Updating lambda image' in: ${calls}`);
});

test('deploy() completes without throwing when logger.silent is true', async () => {
  const { logger } = makeLogger();
  (logger as unknown as { silent: boolean }).silent = true;
  const core = HypertestCore({
    config: makeConfig(logger),
    cloudProvider: makeCloudProvider(),
    testRunner: makeTestRunner(tmpDir),
    events: createEventBus(),
  });

  await assert.doesNotReject(() => core.deploy());
});
