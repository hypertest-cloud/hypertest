import { execSync } from 'node:child_process';

export const isDockerRunning = (): boolean => {
  try {
    execSync('docker info', { stdio: 'ignore' });
    return true;
    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  } catch (error: unknown) {
    return false;
  }
};
