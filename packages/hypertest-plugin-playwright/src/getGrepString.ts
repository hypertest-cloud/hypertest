import path from 'node:path';
import escapeStringRegexp from 'escape-string-regexp';

const getRelativeUnixPath = (from: string, to: string): string => {
  return path.relative(from, to).split(path.sep).join('/');
};

const escapeForTerminalRegex = (value: string): string => {
  const regexSafe = escapeStringRegexp(value);

  return regexSafe.replace(/\\/g, '\\\\');
};

export const getGrepString = (
  projectName: string,
  testDirectory: string,
  specFilePath: string,
  testContextPath: string,
) => {
  const rawParts = [
    projectName,
    getRelativeUnixPath(testDirectory, specFilePath),
    testContextPath,
  ];

  const terminalSafeParts = rawParts.map(escapeForTerminalRegex);
  const pattern = `^${terminalSafeParts.join(' ')}$`;

  return pattern;
};
