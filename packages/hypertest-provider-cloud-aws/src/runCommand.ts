import { execSync } from 'node:child_process';

// TODO: Extract this to some kind of utils package?
export const runCommand = (
  cmd: string,
  options?: {
    cwd?: string;
  },
): void => {
  execSync(cmd, {
    stdio: 'inherit',
    cwd: process.cwd(),
    ...options,
  });
};
