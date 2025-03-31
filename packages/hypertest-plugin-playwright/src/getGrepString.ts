import escapeStringRegexp from 'escape-string-regexp';
import path from 'node:path';

export const getGrepString = (
  projectName: string,
  testDirectory: string,
  specFilePath: string,
  testContextPath: string,
) => {
  const combinedStr = [
    projectName,
    path.relative(testDirectory, specFilePath),
    testContextPath,
  ]
    .map(escapeStringRegexp)
    .join(' ');

  return `^${combinedStr}$`;
};
