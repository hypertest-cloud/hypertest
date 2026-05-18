import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import type { HypertestTestResult, HypertestRunResult } from '@hypertest/hypertest-types';
import { createEventBus } from '../../events.js';
import { createPlainReporter } from '../../ui/reporters/plainReporter.js';

let captured: string[] = [];
let origWrite: typeof process.stdout.write;

beforeEach(() => {
  captured = [];
  origWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = (s: string | Uint8Array) => {
    captured.push(String(s));
    return true;
  };
});

afterEach(() => {
  process.stdout.write = origWrite;
});

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
  runId: 'run-1',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-01T00:00:32Z',
  duration: 32000,
  tests: { total: 3, success: 3, skipped: 0, failed: 0 },
  testResults: [],
  ...overrides,
});

test('run:start outputs test count, concurrency, runId', () => {
  const bus = createEventBus();
  createPlainReporter(bus);
  bus.emit({ type: 'run:start', runId: 'my-run-id', testCount: 5, concurrency: 4 });
  const line = captured.join('');
  assert.ok(line.includes('[run:start]'), `line: ${line}`);
  assert.ok(line.includes('5 tests'), `line: ${line}`);
  assert.ok(line.includes('concurrency 4'), `line: ${line}`);
  assert.ok(line.includes('my-run-id'), `line: ${line}`);
});

test('test:end success outputs check mark and name', () => {
  const bus = createEventBus();
  createPlainReporter(bus);
  bus.emit({ type: 'test:end', testId: 'tid-1', result: makeTestResult({ name: 'passing', status: 'success' }) });
  const line = captured.join('');
  assert.ok(line.includes('[test:end] ✓'), `line: ${line}`);
  assert.ok(line.includes('passing'), `line: ${line}`);
});

test('test:end failed outputs cross mark and error message', () => {
  const bus = createEventBus();
  createPlainReporter(bus);
  bus.emit({
    type: 'test:end',
    testId: 'tid-1',
    result: makeTestResult({
      status: 'failed',
      name: 'broken',
      error: { message: 'expected true' },
    }),
  });
  const line = captured.join('');
  assert.ok(line.includes('[test:end] ✕'), `line: ${line}`);
  assert.ok(line.includes('broken'), `line: ${line}`);
  assert.ok(line.includes('expected true'), `line: ${line}`);
});

test('test:end skipped outputs skip glyph', () => {
  const bus = createEventBus();
  createPlainReporter(bus);
  bus.emit({ type: 'test:end', testId: 'tid-1', result: makeTestResult({ status: 'skipped', name: 'skipped test' }) });
  const line = captured.join('');
  assert.ok(line.includes('[test:end] ◯'), `line: ${line}`);
});

test('run:end outputs counts', () => {
  const bus = createEventBus();
  createPlainReporter(bus);
  bus.emit({
    type: 'run:end',
    runId: 'r1',
    result: makeRunResult({ tests: { total: 3, success: 2, skipped: 1, failed: 0 } }),
  });
  const line = captured.join('');
  assert.ok(line.includes('[run:end]'), `line: ${line}`);
  assert.ok(line.includes('3 tests'), `line: ${line}`);
  assert.ok(line.includes('2 passed'), `line: ${line}`);
});

test('deploy:step start outputs starting message', () => {
  const bus = createEventBus();
  createPlainReporter(bus);
  bus.emit({ type: 'deploy:step', step: 'pullBase', status: 'start' });
  const line = captured.join('');
  assert.ok(line.includes('[deploy]'), `line: ${line}`);
  assert.ok(line.includes('pullBase'), `line: ${line}`);
  assert.ok(line.includes('starting'), `line: ${line}`);
});

test('deploy:step end outputs done with duration', () => {
  const bus = createEventBus();
  createPlainReporter(bus);
  bus.emit({ type: 'deploy:step', step: 'build', status: 'end', durationMs: 12400 });
  const line = captured.join('');
  assert.ok(line.includes('[deploy]'), `line: ${line}`);
  assert.ok(line.includes('done'), `line: ${line}`);
  assert.ok(line.includes('12.4s'), `line: ${line}`);
});

test('deploy:step error outputs error message', () => {
  const bus = createEventBus();
  createPlainReporter(bus);
  bus.emit({ type: 'deploy:step', step: 'push', status: 'error', error: 'ECR auth failed' });
  const line = captured.join('');
  assert.ok(line.includes('[deploy]'), `line: ${line}`);
  assert.ok(line.includes('error:'), `line: ${line}`);
  assert.ok(line.includes('ECR auth failed'), `line: ${line}`);
});

test('doctor:check ok outputs check mark', () => {
  const bus = createEventBus();
  createPlainReporter(bus);
  bus.emit({ type: 'doctor:check', title: 'AWS Creds', status: 'ok', message: 'ok' });
  const line = captured.join('');
  assert.ok(line.includes('[doctor] ✓'), `line: ${line}`);
  assert.ok(line.includes('AWS Creds'), `line: ${line}`);
});

test('doctor:check warn outputs warning glyph', () => {
  const bus = createEventBus();
  createPlainReporter(bus);
  bus.emit({ type: 'doctor:check', title: 'ECR', status: 'warn', message: 'not found' });
  const line = captured.join('');
  assert.ok(line.includes('[doctor] ▲'), `line: ${line}`);
});

test('doctor:check error outputs cross mark', () => {
  const bus = createEventBus();
  createPlainReporter(bus);
  bus.emit({ type: 'doctor:check', title: 'Config', status: 'error', message: 'missing' });
  const line = captured.join('');
  assert.ok(line.includes('[doctor] ✕'), `line: ${line}`);
});

test('log event outputs level and message', () => {
  const bus = createEventBus();
  createPlainReporter(bus);
  bus.emit({ type: 'log', level: 'info', message: 'deploying...' });
  const line = captured.join('');
  assert.ok(line.includes('[info]'), `line: ${line}`);
  assert.ok(line.includes('deploying...'), `line: ${line}`);
});

test('done: unsubscribes listener', async () => {
  const bus = createEventBus();
  const reporter = createPlainReporter(bus);
  await reporter.done();
  bus.emit({ type: 'log', level: 'info', message: 'after unsubscribe' });
  const line = captured.join('');
  assert.ok(!line.includes('after unsubscribe'), `should not receive events after done: ${line}`);
});
