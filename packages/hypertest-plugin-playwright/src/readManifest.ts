import * as fs from 'node:fs';
import * as path from 'node:path';
import type { DockerBuildManifest } from './types.js';

/**
 * Read manifest from project root
 * @param {string} fileName - The name of the file (defaults to manifest.json).
 * @returns {DockerBuildManifest} - readed manifest object
 */
export const readManifest = (
  fileName = 'manifest.json',
): DockerBuildManifest => {
  try {
    const rootPath = path.join(process.cwd(), fileName);

    if (!fs.existsSync(rootPath)) {
      throw new Error(`Warning: File ${fileName} not found.`);
    }

    const rawData = fs.readFileSync(rootPath, 'utf8');

    return JSON.parse(rawData);
  } catch (error: unknown) {
    throw new Error(
      `Failed reading manifest: ${error instanceof Error ? error.message : 'unknown'}`,
    );
  }
};
