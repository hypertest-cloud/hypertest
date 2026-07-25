import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseTestResult } from '../index.js';
import type { TestInvokeResponse } from '@hypertest-cloud/types';

const start = new Date('2024-01-01T10:00:00Z');
const end = new Date('2024-01-01T10:00:02Z'); // 2000ms later

test('success response maps to success status', () => {
  const resp: TestInvokeResponse = {
    success: true,
    name: 'my test',
    filePath: 'tests/foo.spec.ts',
    duration: 1500,
  };
  const result = parseTestResult('tid-1', resp, start, end);
  assert.equal(result.status, 'success');
  assert.equal(result.name, 'my test');
  assert.equal(result.filePath, 'tests/foo.spec.ts');
  assert.equal(result.duration, 1500); // from response, not computed
  assert.equal(result.error, undefined);
});

test('skipped response maps to skipped status', () => {
  const resp: TestInvokeResponse = {
    success: 'skipped',
    name: 'skipped test',
    filePath: 'tests/bar.spec.ts',
  };
  const result = parseTestResult('tid-2', resp, start, end);
  assert.equal(result.status, 'skipped');
  assert.equal(result.error, undefined);
});

test('failed response maps to failed status with error and stackTrace', () => {
  const resp: TestInvokeResponse = {
    success: false,
    message: 'Expected X to equal Y',
    name: 'failing test',
    filePath: 'tests/baz.spec.ts',
    stackTrace: 'Error: Expected X\n  at tests/baz.spec.ts:10:5',
  };
  const result = parseTestResult('tid-3', resp, start, end);
  assert.equal(result.status, 'failed');
  assert.equal(result.error?.message, 'Expected X to equal Y');
  assert.equal(result.error?.stackTrace, 'Error: Expected X\n  at tests/baz.spec.ts:10:5');
  assert.equal(result.duration, 2000); // computed from dates, not response
});

test('failed response without optional fields uses unknown fallbacks', () => {
  const resp: TestInvokeResponse = {
    success: false,
    message: 'crash',
  };
  const result = parseTestResult('tid-4', resp, start, end);
  assert.equal(result.name, 'unknown');
  assert.equal(result.filePath, 'unknown');
  assert.equal(result.error?.stackTrace, undefined);
});

test('testId is propagated to result', () => {
  const resp: TestInvokeResponse = { success: true, name: 'n', filePath: 'f', duration: 100 };
  const result = parseTestResult('my-unique-id', resp, start, end);
  assert.equal(result.testId, 'my-unique-id');
});
