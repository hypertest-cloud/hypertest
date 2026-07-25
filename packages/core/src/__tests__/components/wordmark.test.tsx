import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from 'ink-testing-library';
import { Wordmark } from '../../ui/components/Wordmark.js';

afterEach(() => cleanup());

test('renders hypertest text', () => {
  const { lastFrame } = render(<Wordmark />);
  assert.ok(lastFrame()?.includes('hypertest'), `frame: ${lastFrame()}`);
});

test('renders trailing dot', () => {
  const { lastFrame } = render(<Wordmark />);
  assert.ok(lastFrame()?.includes('.'), `frame: ${lastFrame()}`);
});
