import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { cleanup, render } from 'ink-testing-library';
import { DoctorCheck } from '../../ui/components/DoctorCheck.js';

afterEach(() => cleanup());

test('ok status: renders ✓ icon, title, and message', () => {
  const { lastFrame } = render(
    <DoctorCheck
      status="ok"
      title="AWS Credentials"
      message="region eu-central-1"
    />,
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('✓'), `frame: ${frame}`);
  assert.ok(frame.includes('AWS Credentials'), `frame: ${frame}`);
  assert.ok(frame.includes('region eu-central-1'), `frame: ${frame}`);
});

test('warn status: renders ▲ icon', () => {
  const { lastFrame } = render(
    <DoctorCheck status="warn" title="ECR Repo" message="not found" />,
  );
  assert.ok(lastFrame()?.includes('▲'), `frame: ${lastFrame()}`);
});

test('error status: renders ✕ icon', () => {
  const { lastFrame } = render(
    <DoctorCheck status="error" title="Config" message="missing" />,
  );
  assert.ok(lastFrame()?.includes('✕'), `frame: ${lastFrame()}`);
});

test('data present: renders key-value pairs', () => {
  const { lastFrame } = render(
    <DoctorCheck
      status="ok"
      title="Config"
      message="loaded"
      data={{ region: 'eu-central-1', concurrency: 30 }}
    />,
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('region: eu-central-1'), `frame: ${frame}`);
  assert.ok(frame.includes('concurrency: 30'), `frame: ${frame}`);
});

test('data=null: no key-value section rendered', () => {
  const { lastFrame } = render(
    <DoctorCheck status="ok" title="Config" message="ok" data={null} />,
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('Config'), `frame: ${frame}`);
  assert.ok(!frame.includes(': eu'), `unexpected key-value in frame: ${frame}`);
});

test('data={}: empty object skips data section', () => {
  const { lastFrame } = render(
    <DoctorCheck status="ok" title="Config" message="ok" data={{}} />,
  );
  const frame = lastFrame() ?? '';
  assert.ok(frame.includes('Config'), `frame: ${frame}`);
  assert.ok(frame.includes('ok'), `frame: ${frame}`);
});
