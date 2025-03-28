import { parseStringToRegexp } from './parseStringToRegexp.js';

export const getGrepString = (
  projectName: string,
  testDirectory: string,
  specFilePath: string,
  testContextPath: string,
) => {
  if (!testDirectory.endsWith('/')) {
    // biome-ignore lint/style/noParameterAssign: <explanation>
    testDirectory = `${testDirectory}/`;
  }

  // Verify if specFilePath starts with playwrightTestDir and remove it.
  if (specFilePath.startsWith(testDirectory)) {
    // biome-ignore lint/style/noParameterAssign: <explanation>
    specFilePath = specFilePath.replace(testDirectory, '');
  }

  const combinedStr = [
    parseStringToRegexp(projectName),
    parseStringToRegexp(specFilePath),
    parseStringToRegexp(testContextPath),
  ].join('\\s');

  return `^${combinedStr}$`;
};
