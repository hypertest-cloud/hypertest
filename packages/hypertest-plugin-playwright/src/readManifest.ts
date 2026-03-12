import * as fs from 'node:fs';
import * as path from 'node:path';
import type { DockerBuildManifest } from './types.js';

/**
 * Read manifest from project root
 * @param {string} fileName - The name of the manifest file.
 * @returns {DockerBuildManifest} - Manifest object
 */
export const readManifest = (fileName: string): DockerBuildManifest => {
  try {
    const rootPath = path.join(process.cwd(), fileName);

    if (!fs.existsSync(rootPath)) {
      throw new Error(
        `Manifest file "${fileName}" not found. Please run "npx hypertest deploy" first to create the manifest.`,
      );
    }

    const rawData = fs.readFileSync(rootPath, 'utf8');

    return JSON.parse(rawData);
  } catch (error: unknown) {
    throw new Error(
      `Failed reading manifest: ${error instanceof Error ? error.message : 'unknown'}`,
    );
  }
};
