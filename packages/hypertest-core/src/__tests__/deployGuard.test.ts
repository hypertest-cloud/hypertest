import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runWithDeployGuard } from '../deployGuard.js';

const noop = async () => {};
const mockCore = () => ({ deploy: noop });

test('abort is called when getCore (setup) throws', async () => {
  let abortCalled = false;
  await assert.rejects(
    () => runWithDeployGuard(
      async () => { throw new Error('setup failed'); },
      () => { abortCalled = true; },
    ),
    /setup failed/,
  );
  assert.ok(abortCalled, 'abort should be called when setup throws');
});

test('abort is NOT called when core.deploy() throws after setup succeeds', async () => {
  let abortCalled = false;
  await assert.rejects(
    () => runWithDeployGuard(
      async () => ({ deploy: async () => { throw new Error('deploy failed'); } }),
      () => { abortCalled = true; },
    ),
    /deploy failed/,
  );
  assert.ok(!abortCalled, 'abort should not be called when deploy() throws');
});

test('error is re-thrown so caller can set process.exitCode', async () => {
  const err = new Error('some error');
  await assert.rejects(
    () => runWithDeployGuard(async () => { throw err; }, () => {}),
    (caught: unknown) => caught === err,
  );
});

test('resolves without error on successful deploy', async () => {
  await assert.doesNotReject(
    () => runWithDeployGuard(() => Promise.resolve(mockCore()), () => {}),
  );
});
