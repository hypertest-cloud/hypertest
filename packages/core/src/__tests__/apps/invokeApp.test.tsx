import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from 'ink-testing-library';
import type { HypertestRunResult, HypertestTestResult } from '@hypertest-cloud/types';
import { createEventBus } from '../../events.js';
import { InvokeApp } from '../../ui/apps/InvokeApp.js';

afterEach(() => cleanup());

const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

const makeTestResult = (overrides: Partial<HypertestTestResult> = {}): HypertestTestResult => ({
  testId: 'tid-1',
  name: 'my test',
  filePath: 'tests/foo.spec.ts',
  status: 'success',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-01T00:00:02Z',
  duration: 2000,
  ...overrides,
});

const makeRunResult = (overrides: Partial<HypertestRunResult> = {}): HypertestRunResult => ({
  runId: 'run-abc12345',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-01T00:00:32Z',
  duration: 32000,
  tests: { total: 2, success: 2, skipped: 0, failed: 0 },
  testResults: [],
  ...overrides,
});

test('after run:start: shows INVOKE header with runId prefix and concurrency', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<InvokeApp events={bus} />);
  await flush(); // let useEffect register listener
  bus.emit({ type: 'run:start', runId: 'abc12345-full-id', testCount: 10, concurrency: 4 });
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('INVOKE'), `frame: ${frame}`);
  assert.ok(frame.includes('abc12345'), `frame: ${frame}`);
  assert.ok(frame.includes('4'), `frame: ${frame}`);
});

test('after test:start: shows testId in running list', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<InvokeApp events={bus} />);
  await flush();
  bus.emit({ type: 'run:start', runId: 'run-1', testCount: 3, concurrency: 2 });
  bus.emit({ type: 'test:start', testId: 'aaabbbcc-xyz' });
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('aaabbbcc'), `frame: ${frame}`);
});

test('after test:end success: done test appears in frames', async () => {
  const bus = createEventBus();
  const { frames } = render(<InvokeApp events={bus} />);
  const result = makeTestResult({ testId: 'tid-ok', name: 'passing test', status: 'success' });
  await flush();
  bus.emit({ type: 'run:start', runId: 'run-1', testCount: 1, concurrency: 1 });
  bus.emit({ type: 'test:start', testId: 'tid-ok' });
  bus.emit({ type: 'test:end', testId: 'tid-ok', result });
  await flush();
  const allFrames = frames.join('\n');
  assert.ok(allFrames.includes('passing test'), 'test name not found in any frame');
});

test('after run:end: shows summary with passed count', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<InvokeApp events={bus} />);
  const runResult = makeRunResult({ runId: 'run-abc12345', tests: { total: 1, success: 1, skipped: 0, failed: 0 } });
  await flush();
  bus.emit({ type: 'run:start', runId: 'run-abc12345', testCount: 1, concurrency: 1 });
  bus.emit({ type: 'run:end', runId: 'run-abc12345', result: runResult, localPath: './hypertest.results.json' });
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('1 passed'), `frame: ${frame}`);
});

test('after run:end: shows RESULTS path', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<InvokeApp events={bus} />);
  const runResult = makeRunResult();
  await flush();
  bus.emit({ type: 'run:start', runId: 'run-abc12345', testCount: 2, concurrency: 2 });
  bus.emit({ type: 'run:end', runId: 'run-abc12345', result: runResult, localPath: './hypertest.results.json' });
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('./hypertest.results.json'), `frame: ${frame}`);
});

test('after run:end with artifactsBaseUrl: shows URL in ARTIFACTS', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<InvokeApp events={bus} />);
  const runResult = makeRunResult({ testResults: [] });
  await flush();
  bus.emit({ type: 'run:start', runId: 'run-abc12345', testCount: 1, concurrency: 1 });
  bus.emit({ type: 'run:end', runId: 'run-abc12345', result: runResult, localPath: './hypertest.results.json', artifactsBaseUrl: 's3://bucket/run/' });
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('s3://bucket/run/'), `frame: ${frame}`);
});

test('queued count shown while running', async () => {
  const bus = createEventBus();
  const { lastFrame } = render(<InvokeApp events={bus} />);
  await flush();
  bus.emit({ type: 'run:start', runId: 'run-1', testCount: 10, concurrency: 2 });
  await flush();
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('queued') || frame.includes('10'), `frame: ${frame}`);
});
