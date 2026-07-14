import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initializeLogger } from '../logger.js';

const captureStderr = (fn: () => void): string => {
  const chunks: string[] = [];
  const orig = process.stderr.write.bind(process.stderr);
  // biome-ignore lint/suspicious/noExplicitAny: test instrumentation
  (process.stderr as any).write = (chunk: string | Buffer) => {
    chunks.push(String(chunk));
    return true;
  };
  try {
    fn();
  } finally {
    process.stderr.write = orig;
  }
  return chunks.join('');
};

test('logger.silent=true suppresses all stderr output', () => {
  const logger = initializeLogger({});
  logger.silent = true;
  const output = captureStderr(() => logger.info('silenced message'));
  assert.equal(output, '', 'silent logger should produce no stderr output');
});

test('logger.silent=false (default) writes to stderr', () => {
  const logger = initializeLogger({});
  logger.silent = false;
  const output = captureStderr(() => logger.info('active message'));
  assert.ok(output.length > 0, 'active logger should produce stderr output');
});
