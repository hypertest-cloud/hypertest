import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from 'ink-testing-library';
import { createEventBus } from '../../events.js';
import { DoctorApp } from '../../ui/apps/DoctorApp.js';

afterEach(() => cleanup());

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

test('ok check: shows check mark, title, and message', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<DoctorApp events={bus} />);
  await flush(); // let useEffect register listener
  bus.emit({ type: 'doctor:check', title: 'AWS Credentials', status: 'ok', message: 'region eu-central-1' });
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('✓'), `frame: ${frame}`);
  assert.ok(frame.includes('AWS Credentials'), `frame: ${frame}`);
  assert.ok(frame.includes('region eu-central-1'), `frame: ${frame}`);
});

test('warn check: shows warning glyph', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<DoctorApp events={bus} />);
  await flush();
  bus.emit({ type: 'doctor:check', title: 'ECR Repository', status: 'warn', message: 'not found' });
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('▲'), `frame: ${frame}`);
});

test('error check: shows cross mark', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<DoctorApp events={bus} />);
  await flush();
  bus.emit({ type: 'doctor:check', title: 'Config', status: 'error', message: 'missing hypertest.config.js' });
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('✕'), `frame: ${frame}`);
});

test('multiple checks: all appear in frame', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<DoctorApp events={bus} />);
  await flush();
  bus.emit({ type: 'doctor:check', title: 'Config', status: 'ok', message: 'loaded' });
  bus.emit({ type: 'doctor:check', title: 'AWS', status: 'ok', message: 'connected' });
  bus.emit({ type: 'doctor:check', title: 'ECR', status: 'warn', message: 'repo missing' });
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('Config'), `frame: ${frame}`);
  assert.ok(frame.includes('AWS'), `frame: ${frame}`);
  assert.ok(frame.includes('ECR'), `frame: ${frame}`);
});

test('check with data: shows key-value pairs', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<DoctorApp events={bus} />);
  await flush();
  bus.emit({
    type: 'doctor:check',
    title: 'Hypertest Config',
    status: 'ok',
    message: 'config loaded successfully',
    data: { concurrency: 30, imageName: 'example/playwright' },
  });
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('concurrency'), `frame: ${frame}`);
  assert.ok(frame.includes('30'), `frame: ${frame}`);
});
