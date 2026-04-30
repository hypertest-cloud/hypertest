import type {
  DeployStep,
  HypertestEvents,
  HypertestRunResult,
  HypertestTestResult,
} from '@hypertest/hypertest-types';
import path from 'node:path';
import { promiseMap } from '../utils.js';

interface MockTest {
  name: string;
  filePath: string;
  durationMs: number;
  status: 'success' | 'failed' | 'skipped';
  error?: { message: string; stackTrace: string };
}

const MOCK_TESTS: MockTest[] = [
  { name: 'todo-app.spec.ts › should add todo items',              filePath: 'todo-app.spec.ts',  durationMs: 2317, status: 'success' },
  { name: 'todo-app.spec.ts › should clear input after adding',    filePath: 'todo-app.spec.ts',  durationMs: 1876, status: 'success' },
  { name: 'todo-app.spec.ts › should mark items as complete',      filePath: 'todo-app.spec.ts',  durationMs: 3100, status: 'success' },
  { name: 'todo-app.spec.ts › should mark all items as complete',  filePath: 'todo-app.spec.ts',  durationMs: 2800, status: 'success' },
  { name: 'edit-todo.spec.ts › should allow me to edit a todo',    filePath: 'edit-todo.spec.ts', durationMs: 2500, status: 'success' },
  { name: 'edit-todo.spec.ts › should save edits on blur',         filePath: 'edit-todo.spec.ts', durationMs: 1900, status: 'success' },
  { name: 'edit-todo.spec.ts › should not save empty input',       filePath: 'edit-todo.spec.ts', durationMs: 4200, status: 'skipped' },
  { name: 'filters.spec.ts › should display active items',         filePath: 'filters.spec.ts',   durationMs: 1500, status: 'success' },
  { name: 'filters.spec.ts › should display completed items',      filePath: 'filters.spec.ts',   durationMs: 1700, status: 'success' },
  { name: 'filters.spec.ts › should respect the back button',      filePath: 'filters.spec.ts',   durationMs: 3400, status: 'success' },
  { name: 'counter.spec.ts › should increment on click',           filePath: 'counter.spec.ts',   durationMs: 5100, status: 'success' },
  { name: 'counter.spec.ts › should reset to zero',                filePath: 'counter.spec.ts',   durationMs: 2200, status: 'success' },
  {
    name: 'failing.spec.ts › assertion failure example',
    filePath: 'failing.spec.ts',
    durationMs: 17217,
    status: 'failed',
    error: {
      message: "Error: expect(locator).toHaveText(expected) failed\n\nExpected: \"Buy milk\"\nReceived: \"\"",
      stackTrace: '  at /tests/playwright/tests/failing.spec.ts:9:50',
    },
  },
  {
    name: 'failing.spec.ts › locator timeout on submit',
    filePath: 'failing.spec.ts',
    durationMs: 5312,
    status: 'failed',
    error: {
      message: 'Error: Locator.click: Timeout 5000ms exceeded\nWaiting for locator(\'button[type=submit]\')',
      stackTrace: '  at /tests/playwright/tests/failing.spec.ts:24:14',
    },
  },
];

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Scale factor: divide real durations so the UI demo doesn't take 17s per test
const SPEED = Number(process.env.HYPERTEST_DEV_SPEED ?? 10);

interface HypertestCore {
  deploy: () => Promise<void>;
  invoke: () => Promise<void>;
}

const DEPLOY_STEPS: [DeployStep, number][] = [
  ['pullBase',     1200],
  ['build',        8000],
  ['push',         4500],
  ['manifest',      600],
  ['updateLambda', 5000],
];

export const createDevCore = (events: HypertestEvents): HypertestCore => ({
  deploy: async () => {
    for (const [step, realMs] of DEPLOY_STEPS) {
      const durationMs = Math.round(realMs / SPEED);
      events.emit({ type: 'deploy:step', step, status: 'start' });
      await sleep(durationMs);
      events.emit({ type: 'deploy:step', step, status: 'end', durationMs: realMs });
    }
  },

  invoke: async () => {
    const runId = crypto.randomUUID();
    const runStartDate = new Date();

    events.emit({
      type: 'run:start',
      runId,
      testCount: MOCK_TESTS.length,
      concurrency: 5,
    });

    const testResults: HypertestTestResult[] = await promiseMap(
      MOCK_TESTS,
      async (mock) => {
        const testId = crypto.randomUUID();
        events.emit({ type: 'test:start', testId });
        await sleep(Math.round(mock.durationMs / SPEED));

        const now = new Date();
        const result: HypertestTestResult = {
          testId,
          name: mock.name,
          filePath: mock.filePath,
          status: mock.status,
          startDate: new Date(now.getTime() - mock.durationMs).toISOString(),
          endDate: now.toISOString(),
          duration: mock.durationMs,
          error: mock.error,
        };
        events.emit({ type: 'test:end', testId, result });
        return result;
      },
      { concurrency: 5 },
    );

    const runEndDate = new Date();
    const counts = testResults.reduce(
      (acc, r) => { acc[r.status]++; return acc; },
      { success: 0, skipped: 0, failed: 0 },
    );

    const runResult: HypertestRunResult = {
      runId,
      startDate: runStartDate.toISOString(),
      endDate: runEndDate.toISOString(),
      duration: runEndDate.getTime() - runStartDate.getTime(),
      tests: { total: testResults.length, ...counts },
      testResults,
    };

    events.emit({ type: 'run:end', runId, result: runResult });

    // Write a local results file so the output path in InvokeSummary is real
    const { writeFile } = await import('node:fs/promises');
    const localPath = path.join(process.cwd(), 'hypertest.results.json');
    await writeFile(localPath, JSON.stringify(runResult, null, 2), 'utf-8');
  },
});
