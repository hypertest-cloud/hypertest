import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from 'ink-testing-library';
import { Rule } from '../../ui/components/Rule.js';

afterEach(() => cleanup());

test('renders a line of dashes', () => {
  const { lastFrame } = render(<Rule />);
  assert.ok(lastFrame()?.includes('─'), `frame: ${lastFrame()}`);
});

test('renders exactly 66 dashes', () => {
  const { lastFrame } = render(<Rule />);
  const frame = lastFrame() ?? '';
  const count = (frame.match(/─/g) ?? []).length;
  assert.equal(count, 66, `expected 66 dashes, got ${count} in: ${frame}`);
});
