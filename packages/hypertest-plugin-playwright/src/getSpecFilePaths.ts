import * as fs from 'node:fs';
import * as path from 'node:path';

export function getSpecFilePaths(dir: string): string[] {
  let results: string[] = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(getSpecFilePaths(fullPath));
    } else if (file.endsWith('.spec.ts')) {
      results.push(fullPath);
    }
  }

  return results;
}
