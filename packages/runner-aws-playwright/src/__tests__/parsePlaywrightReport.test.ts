import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePlaywrightReport } from '../utils/parsePlaywrightReport.js';

interface TestResult {
  status: string;
  duration: number;
  error?: { message: string; stack: string };
}
interface PlaywrightTest {
  results: TestResult[];
}
interface Spec {
  title: string;
  file: string;
  line: number;
  column: number;
  tests: PlaywrightTest[];
}
interface Suite {
  title: string;
  specs?: Spec[];
  suites?: Suite[];
}

const makeSpec = (
  overrides: Partial<Spec> & { results?: TestResult[] } = {},
): Spec => ({
  title: 'my spec',
  file: 'tests/foo.spec.ts',
  line: 1,
  column: 1,
  tests: [
    { results: overrides.results ?? [{ status: 'passed', duration: 1500 }] },
  ],
  ...overrides,
});

const makeReport = (suite: Suite) => ({ suites: [suite] });

test('passed test: maps name, filePath, duration, success=true', () => {
  const report = makeReport({ title: 'my suite', specs: [makeSpec()] });
  const result = parsePlaywrightReport(report);
  assert.equal(result.success, true);
  assert.equal(result.name, 'my suite > my spec');
  assert.equal(result.filePath, 'tests/foo.spec.ts');
  assert.equal(result.duration, 1500);
});

test('failed test: maps success=false, message, stackTrace', () => {
  const spec = makeSpec({
    results: [
      {
        status: 'failed',
        duration: 800,
        error: {
          message: 'Expected true but got false',
          stack: 'Error: Expected\n  at foo.spec.ts:5',
        },
      },
    ],
  });
  const result = parsePlaywrightReport(
    makeReport({ title: 'suite', specs: [spec] }),
  );
  assert.equal(result.success, false);
  if (result.success === false) {
    assert.equal(result.message, 'Expected true but got false');
    assert.equal(result.stackTrace, 'Error: Expected\n  at foo.spec.ts:5');
  }
});

test('failed test with no error object: uses fallback strings', () => {
  const spec = makeSpec({ results: [{ status: 'failed', duration: 500 }] });
  const result = parsePlaywrightReport(
    makeReport({ title: 'suite', specs: [spec] }),
  );
  assert.equal(result.success, false);
  if (result.success === false) {
    assert.equal(result.message, 'Unable to retrieve message');
    assert.equal(result.stackTrace, 'Unable to retrieve stack trace');
  }
});

test('skipped test: success=skipped, name and filePath present', () => {
  const spec = makeSpec({ results: [{ status: 'skipped', duration: 0 }] });
  const result = parsePlaywrightReport(
    makeReport({ title: 'suite', specs: [spec] }),
  );
  assert.equal(result.success, 'skipped');
  assert.equal(result.name, 'suite > my spec');
  assert.equal(result.filePath, 'tests/foo.spec.ts');
});

test('nested suites: full name built from parent titles', () => {
  const report = makeReport({
    title: 'outer',
    suites: [
      {
        title: 'inner',
        specs: [makeSpec({ title: 'leaf spec' })],
      },
    ],
  });
  const result = parsePlaywrightReport(report);
  assert.equal(result.name, 'outer > inner > leaf spec');
});

test('suite with empty title: empty segment not prepended to name', () => {
  const report = makeReport({
    title: '',
    specs: [makeSpec({ title: 'standalone spec' })],
  });
  const result = parsePlaywrightReport(report);
  assert.equal(result.name, 'standalone spec');
  assert.ok(
    !result.name.startsWith(' > '),
    `name should not start with ' > ': ${result.name}`,
  );
});

test('no results entry in test: duration falls back to 0, success=true', () => {
  const spec: Spec = {
    title: 'empty results spec',
    file: 'tests/empty.spec.ts',
    line: 1,
    column: 1,
    tests: [{ results: [] }],
  };
  const result = parsePlaywrightReport(
    makeReport({ title: 'suite', specs: [spec] }),
  );
  assert.equal(result.success, true);
  if (result.success === true) {
    assert.equal(result.duration, 0);
  }
});

test('two tests in report: throws "more than one test"', () => {
  const report = makeReport({
    title: 'suite',
    specs: [makeSpec({ title: 'spec one' }), makeSpec({ title: 'spec two' })],
  });
  assert.throws(() => parsePlaywrightReport(report), /more than one test/);
});

test('empty report (no specs): throws "Test was not found"', () => {
  const report = makeReport({ title: 'empty suite', specs: [], suites: [] });
  assert.throws(() => parsePlaywrightReport(report), /not found/);
});
