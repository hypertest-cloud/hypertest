import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { HypertestEvent } from '@hypertest/hypertest-types';
import { createEventBus } from '../events.js';

const sampleEvent: HypertestEvent = {
  type: 'deploy:step',
  step: 'pullBase',
  status: 'start',
};

test('emit delivers event to listener', () => {
  const bus = createEventBus();
  const received: HypertestEvent[] = [];
  bus.on((e) => received.push(e));
  bus.emit(sampleEvent);
  assert.equal(received.length, 1);
  assert.deepEqual(received[0], sampleEvent);
});

test('on returns unsubscribe that stops listener', () => {
  const bus = createEventBus();
  const received: HypertestEvent[] = [];
  const unsub = bus.on((e) => received.push(e));
  bus.emit(sampleEvent);
  unsub();
  bus.emit(sampleEvent);
  assert.equal(received.length, 1);
});

test('multiple listeners all receive events', () => {
  const bus = createEventBus();
  const a: HypertestEvent[] = [];
  const b: HypertestEvent[] = [];
  bus.on((e) => a.push(e));
  bus.on((e) => b.push(e));
  bus.emit(sampleEvent);
  assert.equal(a.length, 1);
  assert.equal(b.length, 1);
});

test('unsubscribing one listener does not affect others', () => {
  const bus = createEventBus();
  const a: HypertestEvent[] = [];
  const b: HypertestEvent[] = [];
  const unsubA = bus.on((e) => a.push(e));
  bus.on((e) => b.push(e));
  bus.emit(sampleEvent);
  unsubA();
  bus.emit(sampleEvent);
  assert.equal(a.length, 1);
  assert.equal(b.length, 2);
});
