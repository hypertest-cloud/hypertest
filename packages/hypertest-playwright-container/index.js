import fs from 'node:fs';
import path from 'node:path';

export const Dockerfile = fs.readFileSync(
  path.join(import.meta.dirname, 'Dockerfile'),
  'utf-8',
);

// biome-ignore lint/style/noDefaultExport: <explanation>
export default Dockerfile;
