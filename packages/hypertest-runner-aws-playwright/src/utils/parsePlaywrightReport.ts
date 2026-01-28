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
          const result = test.results[0];

          const fullTestName = [...currentPath, spec.title].join(' > ');
          const responseBase = {
            name: `${spec.file} > ${fullTestName}`,
            filePath: spec.file,
            duration: result?.duration || 0,
          };
          if (result?.status === 'failed') {
            extractedData.push({
              ...responseBase,
              success: false,
              message: result.error?.message || 'Unable to retrieve message',
              stackTrace:
                result?.error?.stack || 'Unable to retrieve stack trace',
            });
          } else {
            extractedData.push({
              ...responseBase,
              success: true,
            });
          }
        }
      }
    }

    if (suite.suites) {
      for (const subSuite of suite.suites) {
        walk(subSuite, currentPath);
      }
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
