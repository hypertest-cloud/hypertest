import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyDeployStep } from '../../ui/apps/DeployApp.js';

const initialState = () => ({
  steps: {
    pullBase: { status: 'pending' as const },
    build: { status: 'pending' as const },
    push: { status: 'pending' as const },
    manifest: { status: 'pending' as const },
    updateLambda: { status: 'pending' as const },
  },
  status: null as 'success' | 'error' | null,
});

test('start event: step becomes running, overall status unchanged', () => {
  const prev = initialState();
  const next = applyDeployStep(prev, {
    type: 'deploy:step',
    step: 'pullBase',
    status: 'start',
  });
  assert.deepEqual(next.steps.pullBase, { status: 'running' });
  assert.equal(next.status, null);
});

test('end event on non-final step: step becomes done with duration, overall status unchanged', () => {
  const prev = initialState();
  const next = applyDeployStep(prev, {
    type: 'deploy:step',
    step: 'build',
    status: 'end',
    durationMs: 1500,
  });
  assert.deepEqual(next.steps.build, { status: 'done', durationMs: 1500 });
  assert.equal(next.status, null);
});

test('end event on updateLambda: overall status becomes success', () => {
  const prev = initialState();
  const next = applyDeployStep(prev, {
    type: 'deploy:step',
    step: 'updateLambda',
    status: 'end',
    durationMs: 800,
  });
  assert.deepEqual(next.steps.updateLambda, {
    status: 'done',
    durationMs: 800,
  });
  assert.equal(next.status, 'success');
});

test('error event: step becomes error with message, overall status becomes error', () => {
  const prev = initialState();
  const next = applyDeployStep(prev, {
    type: 'deploy:step',
    step: 'push',
    status: 'error',
    error: 'ECR auth failed',
  });
  assert.deepEqual(next.steps.push, {
    status: 'error',
    error: 'ECR auth failed',
  });
  assert.equal(next.status, 'error');
});

test('error event without error string: falls back to unknown error', () => {
  const prev = initialState();
  const next = applyDeployStep(prev, {
    type: 'deploy:step',
    step: 'manifest',
    status: 'error',
  });
  assert.deepEqual(next.steps.manifest, {
    status: 'error',
    error: 'unknown error',
  });
});

test('end event without durationMs: falls back to 0', () => {
  const prev = initialState();
  const next = applyDeployStep(prev, {
    type: 'deploy:step',
    step: 'pullBase',
    status: 'end',
  });
  assert.deepEqual(next.steps.pullBase, { status: 'done', durationMs: 0 });
});

test('only the targeted step changes, siblings are unchanged', () => {
  const prev = initialState();
  const next = applyDeployStep(prev, {
    type: 'deploy:step',
    step: 'build',
    status: 'start',
  });
  assert.deepEqual(next.steps.pullBase, { status: 'pending' });
  assert.deepEqual(next.steps.push, { status: 'pending' });
  assert.deepEqual(next.steps.manifest, { status: 'pending' });
  assert.deepEqual(next.steps.updateLambda, { status: 'pending' });
});

test('does not mutate the previous state', () => {
  const prev = initialState();
  const prevStepsBefore = { ...prev.steps };
  applyDeployStep(prev, {
    type: 'deploy:step',
    step: 'build',
    status: 'end',
    durationMs: 100,
  });
  assert.deepEqual(prev.steps, prevStepsBefore);
});
