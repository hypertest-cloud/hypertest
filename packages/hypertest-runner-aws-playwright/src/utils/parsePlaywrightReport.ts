import type { TestInvokeResponse } from '@hypertest/hypertest-types';

interface TestResult {
  status: string;
  duration: number;
  error?: {
    message: string;
    stack: string;
  };
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

interface PlaywrightReport {
  suites: Suite[];
}

const buildInvokeResponse = (
  spec: Spec,
  test: PlaywrightTest,
  currentPath: string[],
): TestInvokeResponse => {
  const result = test.results[0];
  const name = [...currentPath, spec.title].join(' > ');
  const filePath = spec.file;

  if (result?.status === 'failed') {
    return {
      success: false,
      name,
      filePath,
      message: result.error?.message ?? 'Unable to retrieve message',
      stackTrace: result.error?.stack ?? 'Unable to retrieve stack trace',
    };
  }

  if (result?.status === 'skipped') {
    return { success: 'skipped', name, filePath };
  }

  return { success: true, name, filePath, duration: result?.duration ?? 0 };
};

export const parsePlaywrightReport = (
  report: PlaywrightReport,
): TestInvokeResponse => {
  const extractedData: TestInvokeResponse[] = [];

  const walk = (suite: Suite, parentTitles: string[] = []) => {
    const currentPath = suite.title
      ? [...parentTitles, suite.title]
      : parentTitles;

    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          extractedData.push(buildInvokeResponse(spec, test, currentPath));
        }
      }
    }

    for (const subSuite of suite.suites ?? []) {
      walk(subSuite, currentPath);
    }
  };

  for (const rootSuite of report.suites) {
    walk(rootSuite);
  }

  if (extractedData.length > 1) {
    throw new Error('Playwright executed more than one test.');
  }
  if (extractedData.length === 0) {
    throw new Error('Test was not found.');
  }

  return extractedData[0];
};
