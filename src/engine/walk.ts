import { readdir } from 'node:fs/promises';
import path from 'node:path';

function isSkippedDirectory(name: string): boolean {
  return name === 'node_modules' || name.startsWith('.');
}

/**
 * Lists every regular file under `rootDir` as a root-relative path with forward
 * slashes, sorted. Skips `node_modules` and dot-directories. Symbolic links are
 * not followed, so a link cycle cannot make the walk loop forever.
 */
export async function walkFiles(rootDir: string): Promise<string[]> {
  const files: string[] = [];

  async function visit(dir: string, prefix: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const relativePath = prefix + entry.name;
      if (entry.isDirectory()) {
        if (!isSkippedDirectory(entry.name)) {
          await visit(path.join(dir, entry.name), `${relativePath}/`);
        }
      } else if (entry.isFile()) {
        files.push(relativePath);
      }
    }
  }

  await visit(rootDir, '');
  return files.sort();
}

export function isHtmlFile(relativePath: string): boolean {
  return /\.html?$/i.test(relativePath);
}
