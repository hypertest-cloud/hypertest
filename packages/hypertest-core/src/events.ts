import { EventEmitter } from 'node:events';
import type { HypertestEvent, HypertestEvents } from '@hypertest/hypertest-types';

const EVENT_KEY = 'event';

export const createEventBus = (): HypertestEvents => {
  const emitter = new EventEmitter();
  return {
    emit(event: HypertestEvent): void {
      emitter.emit(EVENT_KEY, event);
    },
    on(listener: (event: HypertestEvent) => void): () => void {
      emitter.on(EVENT_KEY, listener);
      return () => emitter.off(EVENT_KEY, listener);
    },
  };
};
