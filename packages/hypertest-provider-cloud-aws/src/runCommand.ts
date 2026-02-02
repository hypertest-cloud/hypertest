import { execSync } from 'node:child_process';

// TODO: Extract this to some kind of utils package?
export const runCommand = (
  cmd: string,
  options?: {
    cwd?: string;
    input?: string;
  },
): void => {
  execSync(cmd, {
    stdio: options?.input ? 'pipe' : 'inherit',
    cwd: process.cwd(),
    ...options,
  });
};
