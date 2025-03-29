import { execSync } from 'node:child_process';

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
