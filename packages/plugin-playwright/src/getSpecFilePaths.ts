import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export function getSpecFilePaths(dir: string): string[] {
  let results: string[] = [];
  const files = readdirSync(dir);

  for (const file of files) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(getSpecFilePaths(fullPath));
    } else if (file.endsWith('.spec.ts')) {
      results.push(fullPath);
    }
  }

  return results;
}
