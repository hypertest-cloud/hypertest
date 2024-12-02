import { parseStringToRegexp } from "./parseStringToRegexp.js";

export function getGrepString(playwrightTestDir: string, projectName: string, specFilePath: string, testContextPath: string): string {
  // Ensure that playwrightTestDir ends with a slash for consistent handling.
  const normalizedPlaywrightTestDir = playwrightTestDir.endsWith('/') ? playwrightTestDir : `${playwrightTestDir}/`;

  // Verify if specFilePath starts with playwrightTestDir and remove it.
  if (specFilePath.startsWith(normalizedPlaywrightTestDir)) {
    specFilePath = specFilePath.replace(normalizedPlaywrightTestDir, '');
  }

  const combinedStr = [
    parseStringToRegexp(projectName),
    parseStringToRegexp(specFilePath),
    parseStringToRegexp(testContextPath),
  ].join('\\s');

  return `^${combinedStr}$`
}
