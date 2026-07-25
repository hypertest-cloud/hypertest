import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from 'ink-testing-library';
import type { HypertestTestResult } from '@hypertest-cloud/types';
import { TestRow } from '../../ui/components/TestRow.js';

afterEach(() => cleanup());

const makeResult = (overrides: Partial<HypertestTestResult> = {}): HypertestTestResult => ({
  testId: 'test-id-001',
  name: 'my test name',
  filePath: 'tests/foo.spec.ts',
  status: 'success',
  startDate: '2024-01-01T00:00:00Z',
  endDate: '2024-01-01T00:00:02Z',
  duration: 2000,
  ...overrides,
});

test('running row shows running text and truncated testId', () => {
  const { lastFrame } = render(
    <TestRow status="running" testId="abcdef1234567890" />
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('running'), `frame: ${frame}`);
  assert.ok(frame.includes('abcdef12'), `frame: ${frame}`);
});

test('done success row shows check mark and name', () => {
  const { lastFrame } = render(
    <TestRow status="done" result={makeResult({ status: 'success', name: 'passing test' })} />
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('✓'), `frame: ${frame}`);
  assert.ok(frame.includes('passing test'), `frame: ${frame}`);
});

test('done failed row shows cross mark and name', () => {
  const { lastFrame } = render(
    <TestRow status="done" result={makeResult({ status: 'failed', name: 'failing test', duration: 3000 })} />
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('✕'), `frame: ${frame}`);
  assert.ok(frame.includes('failing test'), `frame: ${frame}`);
});

test('done skipped row shows skip glyph and name', () => {
  const { lastFrame } = render(
    <TestRow status="done" result={makeResult({ status: 'skipped', name: 'skipped test' })} />
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('◯'), `frame: ${frame}`);
  assert.ok(frame.includes('skipped test'), `frame: ${frame}`);
});

test('done row shows formatted duration', () => {
  const { lastFrame } = render(
    <TestRow status="done" result={makeResult({ status: 'success', duration: 1500 })} />
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('1.5s'), `frame: ${frame}`);
});
