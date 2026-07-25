import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { render, cleanup } from 'ink-testing-library';
import { StatusIcon } from '../../ui/components/StatusIcon.js';

afterEach(() => cleanup());

test('pass status: renders ✓', () => {
  const { lastFrame } = render(<StatusIcon status="pass" />);
  assert.ok(lastFrame()?.includes('✓'), `frame: ${lastFrame()}`);
});

test('fail status: renders ✕', () => {
  const { lastFrame } = render(<StatusIcon status="fail" />);
  assert.ok(lastFrame()?.includes('✕'), `frame: ${lastFrame()}`);
});

test('skip status: renders ◯', () => {
  const { lastFrame } = render(<StatusIcon status="skip" />);
  assert.ok(lastFrame()?.includes('◯'), `frame: ${lastFrame()}`);
});

test('queued status: renders ○', () => {
  const { lastFrame } = render(<StatusIcon status="queued" />);
  assert.ok(lastFrame()?.includes('○'), `frame: ${lastFrame()}`);
});

test('pending status: renders ·', () => {
  const { lastFrame } = render(<StatusIcon status="pending" />);
  assert.ok(lastFrame()?.includes('·'), `frame: ${lastFrame()}`);
});

test('warn status: renders ▲', () => {
  const { lastFrame } = render(<StatusIcon status="warn" />);
  assert.ok(lastFrame()?.includes('▲'), `frame: ${lastFrame()}`);
});

test('running status: renders without crash (spinner non-deterministic)', () => {
  const { lastFrame } = render(<StatusIcon status="running" />);
  assert.ok((lastFrame() ?? '').length > 0, 'frame should be non-empty');
});
