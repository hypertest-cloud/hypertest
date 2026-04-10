import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const getTestFiles = async (dirPath: string): Promise<string[]> => {
  const dirents = await fs.readdir(dirPath, { withFileTypes: true });

  const files = await Promise.all(
    dirents.map((dirent): Promise<string[]> | string | null => {
      const res = path.resolve(dirPath, dirent.name);

      if (dirent.isDirectory()) {
        return getTestFiles(res);
      }

      return res.endsWith('.spec.ts') ? res : null;
    }),
  );

  return files.flat().filter((file): file is string => Boolean(file));
};

export const hashDirectory = async (dirPath: string) => {
  const hash = crypto.createHash('sha256');

  try {
    const allFiles = await getTestFiles(dirPath);
    const relativeFiles = allFiles
      .map((file) => path.relative(dirPath, file))
      .sort();

    for (const relPath of relativeFiles) {
      const absPath = path.join(dirPath, relPath);
      const fileBuffer = await fs.readFile(absPath);

      const normalizedContent = fileBuffer
        .toString('utf8')
        .replace(/\r\n/g, '\n');

      hash.update(relPath);
      hash.update(normalizedContent);
    }

    return hash.digest('hex');
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed on directory hashing: ${err.message}`);
    }

    throw new Error('Failed on directory hashing');
  }
};
