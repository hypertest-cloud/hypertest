import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { cleanup, render } from 'ink-testing-library';
import { Eyebrow } from '../../ui/components/Eyebrow.js';

afterEach(() => cleanup());

test('lowercase input: renders uppercased', () => {
  const { lastFrame } = render(<Eyebrow>deploy</Eyebrow>);
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('DEPLOY'), `frame: ${frame}`);
  assert.ok(
    !frame.includes('deploy'),
    `frame should not contain lowercase: ${frame}`,
  );
});

test('already-uppercase input: renders unchanged', () => {
  const { lastFrame } = render(<Eyebrow>DOCTOR</Eyebrow>);
  assert.ok(lastFrame()?.includes('DOCTOR'), `frame: ${lastFrame()}`);
});
