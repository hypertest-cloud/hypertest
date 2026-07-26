import { execSync, spawn } from 'node:child_process';

// TODO: Extract this to some kind of utils package?
export const runCommand = (
  cmd: string,
  options?: {
    cwd?: string;
    input?: string;
    silent?: boolean;
  },
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const stdio: 'pipe' | 'inherit' =
      options?.input || options?.silent ? 'pipe' : 'inherit';

    const child = spawn(cmd, {
      shell: true,
      stdio: [stdio, stdio, stdio],
      cwd: options?.cwd ?? process.cwd(),
    });

    if (options?.input) {
      child.stdin?.write(options.input);
      child.stdin?.end();
    }

    const stderrChunks: Buffer[] = [];
    if (stdio === 'pipe') {
      child.stdout?.resume();
      child.stderr?.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
    }

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const stderr = Buffer.concat(stderrChunks).toString().trim();
        const reason = code === null ? 'killed by signal' : `exit code ${code}`;
        reject(new Error(stderr || `Command failed (${reason}): ${cmd}`));
      }
    });

    child.on('error', reject);
  });
};

export const runCommandAndGetOutput = (cmd: string): string => {
  const output = execSync(cmd, {
    stdio: 'pipe',
    cwd: process.cwd(),
    encoding: 'utf-8',
  });

  return output.trim();
};
