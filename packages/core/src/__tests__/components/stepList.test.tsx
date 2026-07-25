import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from 'ink-testing-library';
import type { DeployStep } from '@hypertest-cloud/types';
import { StepList } from '../../ui/components/StepList.js';
import type { StepState } from '../../ui/components/StepList.js';

afterEach(() => cleanup());

const allPending: Record<DeployStep, StepState> = {
  pullBase: { status: 'pending' },
  build: { status: 'pending' },
  push: { status: 'pending' },
  manifest: { status: 'pending' },
  updateLambda: { status: 'pending' },
};

const makeSteps = (overrides: Partial<Record<DeployStep, StepState>> = {}): Record<DeployStep, StepState> => ({
  ...allPending,
  ...overrides,
});

test('all pending: shows all 5 step labels', () => {
  const { lastFrame } = render(<StepList steps={makeSteps()} />);
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('pull base image'), `frame: ${frame}`);
  assert.ok(frame.includes('build container image'), `frame: ${frame}`);
  assert.ok(frame.includes('push image to cloud'), `frame: ${frame}`);
  assert.ok(frame.includes('build manifest'), `frame: ${frame}`);
  assert.ok(frame.includes('update lambda'), `frame: ${frame}`);
});

test('done step: shows formatted duration', () => {
  const { lastFrame } = render(
    <StepList steps={makeSteps({ pullBase: { status: 'done', durationMs: 2300 } })} />
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('pull base image'), `frame: ${frame}`);
  assert.ok(frame.includes('2.3s'), `frame: ${frame}`);
});

test('error step: shows error message text', () => {
  const { lastFrame } = render(
    <StepList steps={makeSteps({ push: { status: 'error', error: 'ECR auth failed' } })} />
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('ECR auth failed'), `frame: ${frame}`);
});

test('running step: renders without crash', () => {
  const { lastFrame } = render(
    <StepList steps={makeSteps({ build: { status: 'running' } })} />
  );
  assert.ok((lastFrame() ?? '').length > 0, 'frame should be non-empty');
});

test('mixed states: all 4 state types simultaneously, all labels present', () => {
  const { lastFrame } = render(
    <StepList steps={makeSteps({
      pullBase: { status: 'done', durationMs: 1000 },
      build: { status: 'running' },
      push: { status: 'error', error: 'network timeout' },
    })} />
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('pull base image'), `frame: ${frame}`);
  assert.ok(frame.includes('build container image'), `frame: ${frame}`);
  assert.ok(frame.includes('push image to cloud'), `frame: ${frame}`);
  assert.ok(frame.includes('build manifest'), `frame: ${frame}`);
  assert.ok(frame.includes('update lambda'), `frame: ${frame}`);
});

test('label order: canonical step order preserved', () => {
  const { lastFrame } = render(<StepList steps={makeSteps()} />);
  const frame = lastFrame() ?? '';
  const pullIdx = frame.indexOf('pull base');
  const buildIdx = frame.indexOf('build container');
  const pushIdx = frame.indexOf('push image');
  const manifestIdx = frame.indexOf('build manifest');
  const lambdaIdx = frame.indexOf('update lambda');
  assert.ok(pullIdx < buildIdx, 'pull before build');
  assert.ok(buildIdx < pushIdx, 'build before push');
  assert.ok(pushIdx < manifestIdx, 'push before manifest');
  assert.ok(manifestIdx < lambdaIdx, 'manifest before lambda');
});
