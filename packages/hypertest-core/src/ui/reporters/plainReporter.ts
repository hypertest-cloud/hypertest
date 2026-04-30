import type { HypertestEvent, HypertestEvents } from '@hypertest/hypertest-types';
import type { Reporter } from './inkReporter.js';

const write = (line: string) => process.stdout.write(`${line}\n`);

const handleInvokeEvent = (event: HypertestEvent) => {
  if (event.type === 'run:start') {
    write(`[run:start] ${event.testCount} tests · concurrency ${event.concurrency} · run ${event.runId}`);
  } else if (event.type === 'test:end') {
    const r = event.result;
    const s = r.status === 'success' ? '✓' : r.status === 'failed' ? '✕' : '◯';
    write(`[test:end] ${s} ${r.name}`);
    if (r.status === 'failed' && r.error) {
      write(`  ${r.error.message}`);
    }
  } else if (event.type === 'run:end') {
    const t = event.result.tests;
    write(`[run:end] ${t.total} tests · ${t.success} passed · ${t.skipped} skipped · ${t.failed} failed`);
  }
};

const handleDeployEvent = (event: HypertestEvent) => {
  if (event.type !== 'deploy:step') { return; }
  if (event.status === 'start') {
    write(`[deploy] ${event.step} starting`);
  } else if (event.status === 'end') {
    write(`[deploy] ${event.step} done (${((event.durationMs ?? 0) / 1000).toFixed(1)}s)`);
  } else {
    write(`[deploy] ${event.step} error: ${event.error}`);
  }
};

const handleEvent = (event: HypertestEvent) => {
  handleInvokeEvent(event);
  handleDeployEvent(event);
  if (event.type === 'doctor:check') {
    const icon = event.status === 'ok' ? '✓' : event.status === 'warn' ? '▲' : '✕';
    write(`[doctor] ${icon} ${event.title}  ${event.message}`);
  } else if (event.type === 'log') {
    write(`[${event.level}] ${event.message}`);
  }
};

export const createPlainReporter = (events: HypertestEvents): Reporter => {
  const unsubscribe = events.on(handleEvent);
  return {
    done: () => {
      unsubscribe();
      return Promise.resolve();
    },
  };
};
