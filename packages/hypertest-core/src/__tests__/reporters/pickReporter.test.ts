import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { createEventBus } from '../../events.js';
import { pickReporter } from '../../ui/reporters/pickReporter.js';

let captured: string[] = [];
let origWrite: typeof process.stdout.write;
let origIsTty: boolean | undefined;

beforeEach(() => {
  captured = [];
  origWrite = process.stdout.write.bind(process.stdout);
  origIsTty = process.stdout.isTTY;
  process.stdout.write = (s: string | Uint8Array) => {
    captured.push(String(s));
    return true;
  };
});

afterEach(() => {
  process.stdout.write = origWrite;
  Object.defineProperty(process.stdout, 'isTTY', {
    value: origIsTty,
    configurable: true,
  });
});

test('isTTY=false, quiet=false: selects plainReporter (emits [deploy] prefix)', () => {
  Object.defineProperty(process.stdout, 'isTTY', {
    value: false,
    configurable: true,
  });
  const bus = createEventBus();
  const reporter = pickReporter('invoke', bus);
  bus.emit({
    type: 'deploy:step',
    step: 'pullBase',
    status: 'start',
  });
  const out = captured.join('');
  assert.ok(out.includes('[deploy]'), `expected [deploy] in output: ${out}`);
  reporter.abort();
});

test('isTTY=undefined, quiet=false: selects plainReporter', () => {
  Object.defineProperty(process.stdout, 'isTTY', {
    value: undefined,
    configurable: true,
  });
  const bus = createEventBus();
  const reporter = pickReporter('deploy', bus);
  bus.emit({
    type: 'deploy:step',
    step: 'pullBase',
    status: 'start',
  });
  const out = captured.join('');
  assert.ok(out.includes('[deploy]'), `expected [deploy] in output: ${out}`);
  reporter.abort();
});

test('isTTY=false, quiet=true: selects plainReporter', () => {
  Object.defineProperty(process.stdout, 'isTTY', {
    value: false,
    configurable: true,
  });
  const bus = createEventBus();
  const reporter = pickReporter('doctor', bus, true);
  bus.emit({
    type: 'deploy:step',
    step: 'pullBase',
    status: 'start',
  });
  const out = captured.join('');
  assert.ok(out.includes('[deploy]'), `expected [deploy] in output: ${out}`);
  reporter.abort();
});

test('isTTY=true, quiet=true: selects plainReporter (quiet overrides TTY)', () => {
  Object.defineProperty(process.stdout, 'isTTY', {
    value: true,
    configurable: true,
  });
  const bus = createEventBus();
  const reporter = pickReporter('invoke', bus, true);
  bus.emit({
    type: 'deploy:step',
    step: 'pullBase',
    status: 'start',
  });
  const out = captured.join('');
  assert.ok(out.includes('[deploy]'), `expected [deploy] in output: ${out}`);
  reporter.abort();
});
