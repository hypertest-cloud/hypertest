import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { cleanup, render } from 'ink-testing-library';
import { createEventBus } from '../../events.js';
import { DeployApp } from '../../ui/apps/DeployApp.js';

afterEach(() => cleanup());

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test('initial render: all 5 step labels present', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<DeployApp events={bus} />);
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('pull base image'), `frame: ${frame}`);
  assert.ok(frame.includes('build container image'), `frame: ${frame}`);
  assert.ok(frame.includes('push image to cloud'), `frame: ${frame}`);
  assert.ok(frame.includes('build manifest'), `frame: ${frame}`);
  assert.ok(frame.includes('update lambda'), `frame: ${frame}`);
});

test('after pullBase start: step shows label', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<DeployApp events={bus} />);
  await flush(); // let useEffect register listener
  bus.emit({ type: 'deploy:step', step: 'pullBase', status: 'start' });
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('pull base image'), `frame: ${frame}`);
});

test('after pullBase end: shows duration', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<DeployApp events={bus} />);
  await flush();
  bus.emit({ type: 'deploy:step', step: 'pullBase', status: 'start' });
  bus.emit({
    type: 'deploy:step',
    step: 'pullBase',
    status: 'end',
    durationMs: 1200,
  });
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('1.2s'), `frame: ${frame}`);
});

test('after build error: shows error message', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<DeployApp events={bus} />);
  await flush();
  bus.emit({
    type: 'deploy:step',
    step: 'build',
    status: 'error',
    error: 'docker daemon not running',
  });
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('docker daemon not running'), `frame: ${frame}`);
});

test('after all 5 steps end: header shows done', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<DeployApp events={bus} />);
  await flush();
  const steps = [
    'pullBase',
    'build',
    'push',
    'manifest',
    'updateLambda',
  ] as const;
  for (const step of steps) {
    bus.emit({ type: 'deploy:step', step, status: 'end', durationMs: 1000 });
  }
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('done'), `expected done in header: ${frame}`);
});
