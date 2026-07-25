import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import type {
  HypertestRunResult,
  HypertestTestResult,
} from '@hypertest-cloud/types';
import { cleanup, render } from 'ink-testing-library';
import { InvokeSummary } from '../../ui/components/InvokeSummary.js';

afterEach(() => cleanup());

const makeTestResult = (
  overrides: Partial<HypertestTestResult> = {},
): HypertestTestResult => ({
  testId: 'tid-1',
  name: 'test name',
  filePath: 'tests/foo.spec.ts',
  status: 'success',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-01T00:00:02Z',
  duration: 2000,
  ...overrides,
});

const makeRunResult = (
  overrides: Partial<HypertestRunResult> = {},
): HypertestRunResult => ({
  runId: 'run-abc12345',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-01T00:00:32Z',
  duration: 32000,
  tests: { total: 3, success: 3, skipped: 0, failed: 0 },
  testResults: [],
  ...overrides,
});

test('all passed: no FAILURES section', () => {
  const result = makeRunResult({
    tests: { total: 3, success: 3, skipped: 0, failed: 0 },
    testResults: [
      makeTestResult({ testId: 'a', status: 'success' }),
      makeTestResult({ testId: 'b', status: 'success' }),
      makeTestResult({ testId: 'c', status: 'success' }),
    ],
  });
  const { lastFrame } = render(
    <InvokeSummary result={result} localPath="./hypertest.results.json" />,
  );
  const frame = lastFrame() ?? '';
  assert.ok(
    !frame.includes('FAILURES'),
    `expected no FAILURES section: ${frame}`,
  );
  assert.ok(frame.includes('3 passed'), `frame: ${frame}`);
});

test('some failed: FAILURES section with test name and error message', () => {
  const failedTest = makeTestResult({
    testId: 'f1',
    status: 'failed',
    name: 'broken test',
    error: { message: 'Expected true to be false', stackTrace: undefined },
  });
  const result = makeRunResult({
    tests: { total: 2, success: 1, skipped: 0, failed: 1 },
    testResults: [makeTestResult({ testId: 'p1' }), failedTest],
  });
  const { lastFrame } = render(
    <InvokeSummary result={result} localPath="./hypertest.results.json" />,
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('FAILURES'), `frame: ${frame}`);
  assert.ok(frame.includes('broken test'), `frame: ${frame}`);
  assert.ok(frame.includes('Expected true to be false'), `frame: ${frame}`);
});

test('failed with stackTrace: shows first 4 lines', () => {
  const stack =
    'Error: fail\n  at a.ts:1\n  at b.ts:2\n  at c.ts:3\n  at d.ts:4\n  at e.ts:5';
  const failedTest = makeTestResult({
    testId: 'f1',
    status: 'failed',
    name: 'stack test',
    error: { message: 'fail', stackTrace: stack },
  });
  const result = makeRunResult({
    tests: { total: 1, success: 0, skipped: 0, failed: 1 },
    testResults: [failedTest],
  });
  const { lastFrame } = render(
    <InvokeSummary result={result} localPath="./hypertest.results.json" />,
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('at a.ts:1'), `frame: ${frame}`);
  assert.ok(frame.includes('at c.ts:3'), `frame: ${frame}`); // 4th line of stackTrace (slice(0,4))
  assert.ok(
    !frame.includes('at d.ts:4'),
    `should truncate after 4 lines: ${frame}`,
  );
});

test('artifactsBaseUrl present: shows URL in ARTIFACTS', () => {
  const result = makeRunResult({ testResults: [] });
  const { lastFrame } = render(
    <InvokeSummary
      result={result}
      localPath="./hypertest.results.json"
      artifactsBaseUrl="s3://my-bucket/run-abc/"
    />,
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('ARTIFACTS'), `frame: ${frame}`);
  assert.ok(frame.includes('s3://my-bucket/run-abc/'), `frame: ${frame}`);
});

test('artifactsBaseUrl absent: shows run ID fallback', () => {
  const result = makeRunResult({ runId: 'run-abc12345', testResults: [] });
  const { lastFrame } = render(
    <InvokeSummary result={result} localPath="./hypertest.results.json" />,
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('run run-abc12345'), `frame: ${frame}`);
});

test('shows RESULTS path', () => {
  const result = makeRunResult({ testResults: [] });
  const { lastFrame } = render(
    <InvokeSummary result={result} localPath="./hypertest.results.json" />,
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('./hypertest.results.json'), `frame: ${frame}`);
});

test('shows formatted DURATION', () => {
  const result = makeRunResult({ duration: 32000, testResults: [] });
  const { lastFrame } = render(
    <InvokeSummary result={result} localPath="./hypertest.results.json" />,
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('32.0s'), `frame: ${frame}`);
});
