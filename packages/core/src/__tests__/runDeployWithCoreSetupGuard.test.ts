import assert from 'node:assert/strict';
import { test } from 'node:test';
import { runDeployWithCoreSetupGuard } from '../runDeployWithCoreSetupGuard.js';

const noop = async () => {
  /* noop */
};
const mockCore = () => ({ deploy: noop });

test('abort is called when setupCoreHandler (setup) throws', async () => {
  let abortCalled = false;
  await assert.rejects(
    () =>
      runDeployWithCoreSetupGuard({
        setupCoreHandler: () => {
          throw new Error('setup failed');
        },
        onSetupFailure: () => {
          abortCalled = true;
        },
      }),
    /setup failed/,
  );
  assert.ok(abortCalled, 'abort should be called when setup throws');
});

test('abort is NOT called when core.deploy() throws after setup succeeds', async () => {
  let abortCalled = false;
  await assert.rejects(
    () =>
      runDeployWithCoreSetupGuard({
        setupCoreHandler: async () => ({
          deploy: () => {
            throw new Error('deploy failed');
          },
        }),
        onSetupFailure: () => {
          abortCalled = true;
        },
      }),
    /deploy failed/,
  );
  assert.ok(!abortCalled, 'abort should not be called when deploy() throws');
});

test('error is re-thrown so caller can set process.exitCode', async () => {
  const err = new Error('some error');
  await assert.rejects(
    () =>
      runDeployWithCoreSetupGuard({
        setupCoreHandler: () => {
          throw err;
        },
        onSetupFailure: () => {
          /* noop */
        },
      }),
    (caught: unknown) => caught === err,
  );
});

test('resolves without error on successful deploy', async () => {
  await assert.doesNotReject(() =>
    runDeployWithCoreSetupGuard({
      setupCoreHandler: () => Promise.resolve(mockCore()),
      onSetupFailure: () => {
        /* noop */
      },
    }),
  );
});
