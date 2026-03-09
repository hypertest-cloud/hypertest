import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  DockerBuildManifest,
  PlaywrightCloudFunctionContext,
} from './types.js';

/**
 * Saves a manifest object to the project root as a JSON file.
 * @param {Object} invokePayloadContexts - Array od cloud function contexts, necessary to invoke single Lambda.
 * @param {string} fileName - The name of the manifest file.
 */
export const saveManifest = (
  invokePayloadContexts: PlaywrightCloudFunctionContext[],
  fileName: string,
) => {
  try {
    const manifest: DockerBuildManifest = {
      invokePayloadContexts,
    };
    const rootPath = path.join(process.cwd(), fileName);

    fs.writeFileSync(rootPath, JSON.stringify(manifest, null, 2), 'utf8');
  } catch (error) {
    throw new Error(
      `Failed to save manifest file: ${error instanceof Error ? error.message : 'unknown'}`,
    );
  }
};
