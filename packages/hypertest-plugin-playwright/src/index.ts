import {
  HypertestPlugin,
} from "@hypertest/hypertest-core";
import * as fs from 'fs';
import * as path from 'path';
import { PlaywrightPluginOptions } from "./types.js";

const PLAYWRIGHT_DIRECTORY = 'tests'

function getSpecFiles(dir: string): string[] {
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

export const Plugin = (options: PlaywrightPluginOptions): HypertestPlugin => ({
  getTestDescription: async () => new Promise(async (resolve, reject) => {
    const specFiles = getSpecFiles(options.projectPath + '/' + PLAYWRIGHT_DIRECTORY);
    console.log('specFiles:', fs.readFileSync(specFiles[0], 'utf8'))

    resolve([])
  }),
});
