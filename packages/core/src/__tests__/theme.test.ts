import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatDuration, icon } from '../ui/theme.js';

test('formatDuration: 0ms → 0.0s', () => {
  assert.equal(formatDuration(0), '0.0s');
});

test('formatDuration: 1500ms → 1.5s', () => {
  assert.equal(formatDuration(1500), '1.5s');
});

test('formatDuration: 59999ms → 60.0s (just below minute threshold, toFixed rounds)', () => {
  assert.equal(formatDuration(59_999), '60.0s');
});

test('formatDuration: 60000ms → 1.0m (at minute threshold)', () => {
  assert.equal(formatDuration(60_000), '1.0m');
});

test('formatDuration: 90000ms → 1.5m', () => {
  assert.equal(formatDuration(90_000), '1.5m');
});

test('icon map has all 7 expected keys', () => {
  const expected = [
    'pass',
    'fail',
    'skip',
    'queued',
    'pending',
    'warn',
    'arrow',
  ] as const;
  for (const key of expected) {
    assert.ok(key in icon, `icon.${key} missing`);
    assert.equal(typeof icon[key], 'string');
  }
});
