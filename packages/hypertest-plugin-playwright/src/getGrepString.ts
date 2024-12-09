import { parseStringToRegexp } from "./parseStringToRegexp.js";
import { PlaywrightPluginOptions } from "./types.js";

export const getGrepString = (options: PlaywrightPluginOptions, specFilePath: string, testContextPath: string) => {
  if (options.lambdaEnvironment === 'unix') {
    // Ensure that playwrightTestDir ends with a slash for consistent handling.
    const normalizedPlaywrightTestDir = options.playwrightConfig.testsDirectory.endsWith('/')
    ? options.playwrightConfig.testsDirectory
    : `${options.playwrightConfig.testsDirectory}/`;

    // Verify if specFilePath starts with playwrightTestDir and remove it.
    if (specFilePath.startsWith(normalizedPlaywrightTestDir)) {
    specFilePath = specFilePath.replace(normalizedPlaywrightTestDir, '');
    }

    const combinedStr = [
      parseStringToRegexp(options.playwrightConfig.projectName),
      parseStringToRegexp(specFilePath),
      parseStringToRegexp(testContextPath),
    ].join('\\s');

    return `^${combinedStr}$`
  } else {
    throw Error('TODO Implement windows case')
  }
}
