import * as fs from 'fs';
import * as path from 'path';

export function getSpecFiles(dir: string): string[] {
  let results: string[] = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(getSpecFiles(fullPath));
    } else if (file.endsWith('.spec.ts')) {
      results.push(fullPath);
    }
  }

  return results;
}
